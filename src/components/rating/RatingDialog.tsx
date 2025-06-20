import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { ratingService } from '@/services/ratingService';
import { useToast } from '@/hooks/use-toast';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  raterId: string;
  ratedId: string;
  ratedName: string;
  ratedType: 'driver' | 'customer';
  onRatingSubmitted?: () => void;
}

const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onOpenChange,
  tripId,
  raterId,
  ratedId,
  ratedName,
  ratedType,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "يرجى اختيار تقييم",
        description: "يجب اختيار عدد النجوم قبل الإرسال",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await ratingService.addRating(
        tripId,
        raterId,
        ratedId,
        rating,
        comment.trim() || undefined
      );

      if (result.success) {
        toast({
          title: "تم إرسال التقييم",
          description: "شكراً لك على تقييمك",
          className: "bg-green-50 border-green-200 text-green-800"
        });
        
        onOpenChange(false);
        onRatingSubmitted?.();
        
        // إعادة تعيين النموذج
        setRating(0);
        setComment('');
      } else {
        toast({
          title: "خطأ في إرسال التقييم",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ أثناء إرسال التقييم",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className={`p-1 transition-colors ${
            isActive ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          <Star 
            className={`w-8 h-8 ${isActive ? 'fill-current' : ''}`}
          />
        </button>
      );
    });
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'سيء جداً';
      case 2: return 'سيء';
      case 3: return 'متوسط';
      case 4: return 'جيد';
      case 5: return 'ممتاز';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center font-cairo text-xl">
            تقييم {ratedType === 'driver' ? 'السائق' : 'العميل'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* معلومات المُقيَّم */}
          <div className="text-center">
            <p className="text-gray-600 font-tajawal">
              كيف كانت تجربتك مع {ratedName}؟
            </p>
          </div>

          {/* النجوم */}
          <div className="flex justify-center items-center space-x-1 space-x-reverse">
            {renderStars()}
          </div>

          {/* نص التقييم */}
          {(hoveredRating || rating) > 0 && (
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700 font-tajawal">
                {getRatingText(hoveredRating || rating)}
              </p>
            </div>
          )}

          {/* التعليق */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 font-tajawal">
              تعليق (اختياري)
            </label>
            <Textarea
              placeholder="شاركنا رأيك حول التجربة..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] font-tajawal"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-left">
              {comment.length}/500
            </p>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex space-x-3 space-x-reverse">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 btn-taxi"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
