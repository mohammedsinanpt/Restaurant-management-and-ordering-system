import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMenu, fetchMenuItem, submitReview } from '../api';
import { Star, Clock, Flame, ArrowLeft, Plus, Minus, ShoppingBag, ThumbsUp, MessageSquare, Check } from 'lucide-react';
import { useUser } from '../context/UserContext';

const formatReview = (r) => ({
    id: r.id,
    user: r.customer_name,
    rating: r.rating,
    date: new Date(r.created_at).toLocaleDateString(),
    comment: r.comment,
});

const DishDetailsPage = ({ addToCart }) => {
    const { currentUser } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data States
  const [dish, setDish] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interaction States
  const [quantity, setQuantity] = useState(1);
  const [selectedVariety, setSelectedVariety] = useState('Medium');
  const [addedSuccess, setAddedSuccess] = useState(false); // <--- New state for button feedback
  
  // Review States
  const [reviews, setReviews] = useState([]); 
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadDishAndReviews = async () => {
      setLoading(true);

      try {
          const [{ data: foundDish }, { data: allItems }] = await Promise.all([
              fetchMenuItem(id),
              fetchMenu(),
          ]);
          setDish(foundDish);
          setSuggested(allItems.filter(d => d.id != id).slice(0, 3));
          setReviews((foundDish.reviews || []).map(formatReview).reverse());
      } catch (e) {
          console.error('Failed to load dish:', e);
          setDish(null);
      }

      setLoading(false);
    };

    loadDishAndReviews();
    window.scrollTo(0, 0);
  }, [id]);

  const handleSubmitReview = async () => {
    if (userRating === 0) {
        alert("Please select a star rating!");
        return;
    }
    if (reviewText.trim() === "") {
        alert("Please write a comment!");
        return;
    }

    setIsSubmitting(true);
    const userName = currentUser?.name || currentUser?.email?.split('@')[0] || "Guest User";

    try {
        const { data } = await submitReview({
            menu_item: dish.id,
            customer_name: userName,
            rating: userRating,
            comment: reviewText,
        });

        setReviews(prev => [formatReview(data), ...prev]);
        setUserRating(0);
        setReviewText("");
    } catch (e) {
        console.error('Failed to submit review:', e);
        alert('Could not submit your review. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- NEW: Handle Add to Cart without navigation ---
  const handleAddToCart = () => {
      if (dish.is_available !== false) {
          addToCart(dish, quantity, selectedVariety);
          
          // Show success state
          setAddedSuccess(true);
          
          // Reset after 2 seconds
          setTimeout(() => {
              setAddedSuccess(false);
          }, 2000);
      }
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center animate-pulse">Loading Culinary Art...</div>;

  if (!dish) return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">Dish Not Found</h2>
          <p className="text-zinc-400">The dish you are looking for is currently unavailable or has been removed.</p>
          <button 
            onClick={() => navigate('/menu')}
            className="px-6 py-2 bg-orange-600 rounded-full font-bold hover:bg-orange-500 transition-colors"
          >
            Return to Menu
          </button>
      </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 font-sans">
      {/* Hero Image Section */}
      <div className="relative h-[45vh] lg:h-[50vh] w-full group">
        <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        <button 
            onClick={() => navigate('/menu')} 
            className="absolute top-6 left-6 bg-black/30 backdrop-blur-md p-3 rounded-full hover:bg-black/50 border border-white/10 transition-all z-20 group/back"
        >
          <ArrowLeft className="w-6 h-6 group-hover/back:-translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-32 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Details Card */}
            <div className="lg:col-span-2 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h1 className="text-3xl md:text-4xl font-black font-serif mb-2 text-white">{dish.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-md"><Clock className="w-4 h-4" /> 20-25 mins</span>
                      <span className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-md"><Flame className="w-4 h-4 text-orange-500" /> {dish.calories || 350} kcal</span>
                      <span className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-md"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {dish.average_rating ? dish.average_rating.toFixed(1) : 'New'} ({reviews.length})</span>
                    </div>
                 </div>
                 <span className="text-3xl font-black text-orange-500 whitespace-nowrap">₹{dish.price}</span>
              </div>

              <p className="text-zinc-300 leading-relaxed mb-8 text-lg font-light">{dish.description || "A delicious culinary experience prepared with fresh ingredients."}</p>

              {/* Customization */}
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Customize Flavor</h3>
                <div className="flex flex-wrap gap-3">
                  {['Mild', 'Medium', 'Spicy', 'Extra Hot'].map(level => (
                    <button 
                      key={level}
                      onClick={() => setSelectedVariety(level)}
                      className={`px-6 py-2.5 rounded-xl border font-medium transition-all ${
                          selectedVariety === level 
                          ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105' 
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-white/10">
                <div className="flex items-center bg-zinc-950 rounded-xl border border-zinc-800 p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-4 hover:bg-zinc-800 rounded-lg text-white transition-colors"><Minus className="w-5 h-5" /></button>
                  <span className="w-12 text-center font-bold text-xl">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-4 hover:bg-zinc-800 rounded-lg text-white transition-colors"><Plus className="w-5 h-5" /></button>
                </div>
                
                {/* MODIFIED BUTTON */}
                <button 
                  disabled={!dish.is_available && dish.is_available !== undefined}
                  onClick={handleAddToCart}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3 group/btn ${
                      dish.is_available === false 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : addedSuccess 
                        ? 'bg-green-600 text-white scale-95' 
                        : 'bg-white text-black hover:bg-orange-500 hover:text-white hover:shadow-orange-500/30'
                  }`}
                >
                  {addedSuccess ? (
                      <>
                        <Check className="w-5 h-5" /> Added to Cart!
                      </>
                  ) : (
                      <>
                        <ShoppingBag className="w-5 h-5 group-hover/btn:animate-bounce" /> 
                        {dish.is_available === false ? "Currently Unavailable" : `Add to Order — ₹${dish.price * quantity}`}
                      </>
                  )}
                </button>
              </div>
            </div>

            {/* Suggestions Sidebar */}
            <div className="lg:col-span-1 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-orange-500" /> You Might Also Like
                </h3>
                <div className="grid gap-4">
                    {suggested.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => navigate(`/dish/${item.id}`)} 
                        className="group flex gap-4 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl hover:border-orange-500/30 hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h4 className="font-bold text-zinc-100 line-clamp-1 group-hover:text-orange-400 transition-colors">{item.name}</h4>
                            <p className="text-orange-500 font-bold text-sm mt-1">₹{item.price}</p>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 grid lg:grid-cols-2 gap-12">
             {/* Write Review */}
             <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-orange-500" /> Write a Review
                </h2>
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                    <div className="flex gap-2 mb-4">
                        {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setUserRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                                <Star className={`w-8 h-8 ${star <= userRating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
                            </button>
                        ))}
                    </div>
                    <textarea 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your dining experience..." 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:border-orange-500 outline-none h-32 resize-none mb-4"
                    />
                    <button 
                        onClick={handleSubmitReview}
                        disabled={isSubmitting}
                        className={`bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-white hover:text-black transition-colors w-full flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
             </div>

             {/* Review List */}
             <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    Customer Stories <span className="text-sm bg-zinc-800 px-2 py-1 rounded-full text-zinc-400 font-normal">{reviews.length}</span>
                </h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 animate-in slide-in-from-bottom duration-500">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold text-white shadow-lg">
                                        {review.user.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{review.user}</p>
                                        <p className="text-xs text-zinc-500">{review.date}</p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">"{review.comment}"</p>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default DishDetailsPage;