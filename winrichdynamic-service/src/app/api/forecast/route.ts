import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';
import Order from '@/models/Order';
import Quotation from '@/models/Quotation';
import Project from '@/models/Project';

// GET: ดึงข้อมูลการพยากรณ์การขาย
export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Get user info from token for RBAC
    let userFilter = {};
    try {
      const authHeader = (request.headers as any).get?.('authorization') as string | null;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      const cookieToken = (await cookies()).get('b2b_token')?.value;
      const token = bearer || cookieToken;
      
      if (token) {
        const payload: any = jose.decodeJwt(token);
        const roleName = String(payload.role || '').toLowerCase();
        
        if (roleName === 'seller') {
          // จำกัดข้อมูลสำหรับ Seller ให้เห็นเฉพาะของตนเอง
          userFilter = { ownerId: payload.adminId };
        }
      }
    } catch (error) {
      console.error('[Forecast API] Token decode error:', error);
    }

    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '6months'; // 3months, 6months, 1year
    const forecastType = url.searchParams.get('type') || 'conservative'; // conservative, moderate, aggressive

    // Calculate date ranges based on period
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (period) {
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 6, 0);
        break;
      case '1year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 6, 0);
    }

    // Get historical data for the same period last year
    const lastYearStart = new Date(startDate);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    const lastYearEnd = new Date(endDate);
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

    // Get historical sales data
    const historicalSales = await Deal.aggregate([
      {
        $match: {
          ...userFilter,
          status: 'won',
          createdAt: { $gte: lastYearStart, $lte: lastYearEnd }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalValue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get current pipeline data
    const pipelineData = await Deal.aggregate([
      {
        $match: {
          ...userFilter,
          status: 'open',
          expectedCloseDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$expectedCloseDate' },
            month: { $month: '$expectedCloseDate' }
          },
          totalValue: { $sum: '$amount' },
          weightedValue: { $sum: { $multiply: ['$amount', { $divide: ['$probability', 100] }] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get quotation data (potential future deals)
    const quotationData = await Quotation.aggregate([
      {
        $match: {
          ...userFilter,
          status: { $in: ['sent', 'accepted'] },
          validUntil: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$validUntil' },
            month: { $month: '$validUntil' }
          },
          totalValue: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get project data (potential revenue)
    const projectData = await Project.aggregate([
      {
        $match: {
          ...userFilter,
          status: { $in: ['planning', 'proposed', 'quoted', 'testing', 'approved'] },
          startDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          totalValue: { $sum: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Calculate growth factors based on forecast type
    let growthFactor = 1.0;
    let probabilityFactor = 1.0;
    
    switch (forecastType) {
      case 'conservative':
        growthFactor = 1.05; // 5% growth
        probabilityFactor = 0.7; // 70% of weighted pipeline
        break;
      case 'moderate':
        growthFactor = 1.15; // 15% growth
        probabilityFactor = 0.8; // 80% of weighted pipeline
        break;
      case 'aggressive':
        growthFactor = 1.25; // 25% growth
        probabilityFactor = 0.9; // 90% of weighted pipeline
        break;
    }

    // Generate forecast data for each month in the period
    const forecastData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Find historical data for same month last year
      const historicalMonth = historicalSales.find(
        item => item._id.year === year - 1 && item._id.month === month
      );
      
      // Find pipeline data for current month
      const pipelineMonth = pipelineData.find(
        item => item._id.year === year && item._id.month === month
      );
      
      // Find quotation data for current month
      const quotationMonth = quotationData.find(
        item => item._id.year === year && item._id.month === month
      );
      
      // Find project data for current month
      const projectMonth = projectData.find(
        item => item._id.year === year && item._id.month === month
      );
      
      // Calculate forecast
      const historicalValue = historicalMonth?.totalValue || 0;
      const pipelineValue = (pipelineMonth?.weightedValue || 0) * probabilityFactor;
      const quotationValue = (quotationMonth?.totalValue || 0) * 0.5; // 50% conversion rate
      const projectValue = (projectMonth?.totalValue || 0) * 0.8; // 80% completion rate
      
      // Apply growth factor to historical data
      const adjustedHistorical = historicalValue * growthFactor;
      
      // Combine all sources for forecast
      const forecastValue = Math.max(adjustedHistorical, pipelineValue + quotationValue + projectValue);
      
      forecastData.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        historical: historicalValue,
        pipeline: pipelineMonth?.totalValue || 0,
        weightedPipeline: pipelineMonth?.weightedValue || 0,
        quotations: quotationMonth?.totalValue || 0,
        projects: projectMonth?.totalValue || 0,
        forecast: Math.round(forecastValue),
        confidence: calculateConfidence(historicalValue, pipelineValue, quotationValue, projectValue)
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Calculate summary statistics
    const totalHistorical = forecastData.reduce((sum, item) => sum + item.historical, 0);
    const totalForecast = forecastData.reduce((sum, item) => sum + item.forecast, 0);
    const totalPipeline = forecastData.reduce((sum, item) => sum + item.pipeline, 0);
    const growthRate = totalHistorical > 0 ? ((totalForecast - totalHistorical) / totalHistorical * 100) : 0;

    // Get top opportunities contributing to forecast
    const topOpportunities = await Deal.find({
      ...userFilter,
      status: 'open',
      expectedCloseDate: { $gte: startDate, $lte: endDate }
    })
    .sort({ amount: -1 })
    .limit(10)
    .select('title customerName amount expectedCloseDate probability stageName')
    .lean();

    // Get risk factors
    const riskFactors = await analyzeRiskFactors(userFilter);

    const forecastResult = {
      period,
      forecastType,
      growthFactor,
      summary: {
        totalForecast,
        totalHistorical,
        totalPipeline,
        growthRate: Math.round(growthRate * 10) / 10,
        averageMonthlyForecast: Math.round(totalForecast / forecastData.length),
        confidence: calculateOverallConfidence(forecastData)
      },
      monthlyData: forecastData,
      topOpportunities,
      riskFactors,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(forecastResult);
    
  } catch (error) {
    console.error('[Forecast API] GET Error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการพยากรณ์' },
      { status: 500 }
    );
  }
}

// Helper function to calculate confidence score
function calculateConfidence(historical: number, pipeline: number, quotations: number, projects: number) {
  let confidence = 50; // Base confidence
  
  if (historical > 0) confidence += 20;
  if (pipeline > 0) confidence += 15;
  if (quotations > 0) confidence += 10;
  if (projects > 0) confidence += 5;
  
  return Math.min(confidence, 100);
}

// Helper function to calculate overall confidence
function calculateOverallConfidence(forecastData: any[]) {
  const totalConfidence = forecastData.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round(totalConfidence / forecastData.length);
}

// Helper function to analyze risk factors
async function analyzeRiskFactors(userFilter: any) {
  const risks = [];
  
  // Check for concentration risk (too much revenue from few deals)
  const topDeals = await Deal.find({ ...userFilter, status: 'open' })
    .sort({ amount: -1 })
    .limit(5)
    .select('amount')
    .lean();
  
  const totalPipeline = topDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const topDealPercentage = topDeals.length > 0 ? (topDeals[0].amount / totalPipeline * 100) : 0;
  
  if (topDealPercentage > 50) {
    risks.push({
      type: 'concentration',
      level: 'high',
      description: 'การพึ่งพาดีลใหญ่เพียงไม่กี่ดีลมากเกินไป',
      impact: 'ความเสี่ยงสูงหากดีลหลักไม่สำเร็จ'
    });
  }
  
  // Check for aging pipeline
  const agingDeals = await Deal.countDocuments({
    ...userFilter,
    status: 'open',
    createdAt: { $lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Older than 90 days
  });
  
  if (agingDeals > 0) {
    risks.push({
      type: 'aging',
      level: 'medium',
      description: `มี ${agingDeals} ดีลที่อยู่ในพายไลน์นานเกิน 90 วัน`,
      impact: 'อาจส่งผลต่อความน่าจะเป็นในการปิดการขาย'
    });
  }
  
  // Check for seasonal patterns (simplified)
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 11 || currentMonth <= 1) {
    risks.push({
      type: 'seasonal',
      level: 'low',
      description: 'ช่วงเวลาที่อาจมีฤดูกาลการขายช้า',
      impact: 'อาจต้องปรับเป้าหมายการขายในช่วงนี้'
    });
  }
  
  return risks;
}