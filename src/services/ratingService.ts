import { supabase } from '@/integrations/supabase/client';

export interface Rating {
  id: string;
  trip_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface RatingStats {
  average_rating: number;
  total_ratings: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const ratingService = {
  // إضافة تقييم
  async addRating(
    tripId: string,
    raterId: string,
    ratedId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // التحقق من وجود تقييم سابق
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('trip_id', tripId)
        .eq('rater_id', raterId)
        .single();

      if (existingRating) {
        return { success: false, error: 'تم إضافة التقييم مسبقاً لهذه الرحلة' };
      }

      // إضافة التقييم الجديد
      const { error } = await supabase
        .from('ratings')
        .insert({
          trip_id: tripId,
          rater_id: raterId,
          rated_id: ratedId,
          rating,
          comment
        });

      if (error) throw error;

      // تحديث متوسط التقييم في جدول المستخدمين
      await this.updateUserRatingAverage(ratedId);

      return { success: true };
    } catch (error: any) {
      console.error('Error adding rating:', error);
      return { success: false, error: error.message };
    }
  },

  // تحديث متوسط التقييم للمستخدم
  async updateUserRatingAverage(userId: string): Promise<void> {
    try {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_id', userId);

      if (ratings && ratings.length > 0) {
        const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        await supabase
          .from('profiles')
          .update({
            average_rating: Math.round(average * 10) / 10,
            total_ratings: ratings.length
          })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error updating user rating average:', error);
    }
  },

  // الحصول على تقييمات المستخدم
  async getUserRatings(userId: string): Promise<Rating[]> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rater:profiles!ratings_rater_id_fkey(name, avatar_url),
          trip:trips(from_location, to_location, created_at)
        `)
        .eq('rated_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      return [];
    }
  },

  // الحصول على إحصائيات التقييم
  async getRatingStats(userId: string): Promise<RatingStats> {
    try {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('rated_id', userId);

      if (!ratings || ratings.length === 0) {
        return {
          average_rating: 0,
          total_ratings: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const total = ratings.length;
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / total;

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(r => {
        distribution[r.rating as keyof typeof distribution]++;
      });

      return {
        average_rating: Math.round(average * 10) / 10,
        total_ratings: total,
        rating_distribution: distribution
      };
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      return {
        average_rating: 0,
        total_ratings: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  },

  // الحصول على تقييم رحلة محددة
  async getTripRating(tripId: string, raterId: string): Promise<Rating | null> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('trip_id', tripId)
        .eq('rater_id', raterId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching trip rating:', error);
      return null;
    }
  },

  // تحديث تقييم موجود
  async updateRating(
    ratingId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ratings')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', ratingId);

      if (error) throw error;

      // تحديث متوسط التقييم
      const { data: ratingData } = await supabase
        .from('ratings')
        .select('rated_id')
        .eq('id', ratingId)
        .single();

      if (ratingData) {
        await this.updateUserRatingAverage(ratingData.rated_id);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating rating:', error);
      return { success: false, error: error.message };
    }
  },

  // حذف تقييم
  async deleteRating(ratingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // الحصول على معلومات التقييم قبل الحذف
      const { data: ratingData } = await supabase
        .from('ratings')
        .select('rated_id')
        .eq('id', ratingId)
        .single();

      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('id', ratingId);

      if (error) throw error;

      // تحديث متوسط التقييم بعد الحذف
      if (ratingData) {
        await this.updateUserRatingAverage(ratingData.rated_id);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting rating:', error);
      return { success: false, error: error.message };
    }
  },

  // الحصول على أفضل السائقين
  async getTopDrivers(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, average_rating, total_ratings')
        .eq('role', 'driver')
        .not('average_rating', 'is', null)
        .gte('total_ratings', 5)
        .order('average_rating', { ascending: false })
        .order('total_ratings', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top drivers:', error);
      return [];
    }
  }
};
