import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/authService';

// Mock للـ toast
const mockToast = vi.fn();

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        name: 'أحمد محمد',
        phone: '0987654321',
        role: 'customer',
        governorate: 'دمشق'
      };

      const result = await authService.signUp(userData, mockToast);
      
      expect(result).toBe(true);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "تم إرسال رمز التحقق"
        })
      );
    });

    it('should handle registration errors', async () => {
      // Mock error response
      vi.mocked(authService.signUp).mockRejectedValueOnce(new Error('Network error'));

      const userData = {
        name: 'أحمد محمد',
        phone: '0987654321',
        role: 'customer',
        governorate: 'دمشق'
      };

      const result = await authService.signUp(userData, mockToast);
      
      expect(result).toBe(false);
    });
  });

  describe('signIn', () => {
    it('should successfully sign in existing user', async () => {
      const phone = '0987654321';
      
      const result = await authService.signIn(phone, mockToast);
      
      expect(result.success).toBe(true);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "تم تسجيل الدخول بنجاح"
        })
      );
    });

    it('should handle non-existent user', async () => {
      const phone = '0000000000';
      
      const result = await authService.signIn(phone, mockToast);
      
      expect(result.success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "المستخدم غير موجود"
        })
      );
    });
  });

  describe('verifyOtp', () => {
    it('should successfully verify OTP for new user', async () => {
      const phone = '0987654321';
      const code = '123456';
      
      // Mock pending registration
      const pendingData = {
        name: 'أحمد محمد',
        phone: '0987654321',
        role: 'customer',
        governorate: 'دمشق'
      };
      
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(pendingData));
      
      const result = await authService.verifyOtp(phone, code, mockToast);
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });

    it('should handle invalid OTP', async () => {
      const phone = '0987654321';
      const code = '000000';
      
      const result = await authService.verifyOtp(phone, code, mockToast);
      
      expect(result.success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "رمز التحقق غير صحيح"
        })
      );
    });
  });
});
