import mongoose from 'mongoose';
import { Schema, model, models } from 'mongoose';
import { PERMISSIONS, ALL_PERMISSIONS } from '@/constants/permissions';

// Re-export เพื่อ backward compatibility
export { PERMISSIONS, ALL_PERMISSIONS };

export interface IUserPermission {
  phoneNumber: string; // เบอร์โทรของผู้ใช้ที่ได้รับสิทธิ์
  permissions: string[]; // รายการสิทธิ์
  grantedBy: string; // เบอร์โทรของแอดมินที่ให้สิทธิ์
  grantedAt: Date; // วันที่ให้สิทธิ์
  isActive: boolean; // สิทธิ์ยังใช้งานได้หรือไม่
  note?: string; // หมายเหตุ
  createdAt: Date;
  updatedAt: Date;
}

const userPermissionSchema = new Schema<IUserPermission>(
  {
    phoneNumber: {
      type: String,
      required: [true, 'ต้องระบุเบอร์โทรศัพท์'],
      trim: true,
      match: [
        /^\+?66\d{9}$/,
        'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
      ],
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function(permissions: string[]) {
          // ตรวจสอบว่าสิทธิ์ที่ระบุมีอยู่ในระบบหรือไม่
          return permissions.every(permission => ALL_PERMISSIONS.includes(permission as any));
        },
        message: 'มีสิทธิ์ที่ไม่ถูกต้องในระบบ'
      }
    },
    grantedBy: {
      type: String,
      required: [true, 'ต้องระบุผู้ให้สิทธิ์'],
      trim: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    note: {
      type: String,
      maxlength: [500, 'หมายเหตุต้องมีความยาวไม่เกิน 500 ตัวอักษร'],
    },
  },
  {
    timestamps: true,
  }
);

// เพิ่มดัชนีสำหรับการค้นหา (ผู้ใช้หนึ่งคนมีได้แค่ record เดียว)
userPermissionSchema.index({ phoneNumber: 1 }, { unique: true });
userPermissionSchema.index({ isActive: 1 });
userPermissionSchema.index({ grantedAt: -1 });

// เพิ่ม static methods
userPermissionSchema.statics.getUserPermissions = async function(phoneNumber: string) {
  const userPermission = await this.findOne({ phoneNumber, isActive: true });
  return userPermission ? userPermission.permissions : [];
};

userPermissionSchema.statics.hasPermission = async function(phoneNumber: string, permission: string) {
  const userPermissions = await this.getUserPermissions(phoneNumber);
  return userPermissions.includes(permission);
};

userPermissionSchema.statics.hasAnyPermission = async function(phoneNumber: string, permissions: string[]) {
  const userPermissions = await this.getUserPermissions(phoneNumber);
  return permissions.some(permission => userPermissions.includes(permission));
};

// ตรวจสอบว่ามีโมเดลแล้วหรือไม่ เพื่อป้องกันการสร้างโมเดลซ้ำ
const UserPermission = models.UserPermission || model<IUserPermission>('UserPermission', userPermissionSchema);

export default UserPermission as mongoose.Model<IUserPermission> & {
  getUserPermissions(phoneNumber: string): Promise<string[]>;
  hasPermission(phoneNumber: string, permission: string): Promise<boolean>;
  hasAnyPermission(phoneNumber: string, permissions: string[]): Promise<boolean>;
}; 