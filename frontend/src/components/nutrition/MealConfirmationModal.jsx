import { useState } from 'react'
import { X, Check, Plus, Minus, AlertCircle, Loader } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { nutritionApi } from '../../utils/api'

/**
 * Meal Confirmation Modal
 * Shows detected foods, allows portion adjustment before logging
 */
export default function MealConfirmationModal({ 
  analysisResult, 
  onConfirm, 
  onCancel 
}) {
  // Transform API response to expected format
  // API returns: detected_foods: [{food, confidence, portion_grams, nutrition: {calories, protein, carbs, fats}}]
  // Modal expects: [{name, calories, protein, carbs, fats, portion_grams, confidence}]
  const transformFoods = (result) => {
    const detectedFoods = result?.detected_foods || result?.breakdown || []
    return detectedFoods.map(item => ({
      name: item.food || item.name || 'Unknown Food',
      calories: item.nutrition?.calories || item.calories || 0,
      protein: item.nutrition?.protein || item.protein || 0,
      carbs: item.nutrition?.carbs || item.carbs || 0,
      fats: item.nutrition?.fats || item.fats || 0,
      portion_grams: item.portion_grams || 100,
      confidence: item.confidence || 0.5,
      detected_as: item.detected_as || item.food || item.name
    }))
  }

  const [items, setItems] = useState(() => transformFoods(analysisResult))
  const [mealType, setMealType] = useState('lunch')
  const [saving, setSaving] = useState(false)

  // Store original items for portion recalculation
  const [originalItems] = useState(() => transformFoods(analysisResult))

  // Handle portion adjustment
  const updatePortion = (index, newPortion) => {
    const updated = [...items]
    updated[index].portion_grams = Math.max(10, newPortion)
    
    // Recalculate nutrition (linear scaling based on original)
    const originalItem = originalItems[index]
    if (originalItem && originalItem.portion_grams > 0) {
      const ratio = newPortion / originalItem.portion_grams
      updated[index].calories = Math.round(originalItem.calories * ratio)
      updated[index].protein = Math.round(originalItem.protein * ratio * 10) / 10
      updated[index].carbs = Math.round(originalItem.carbs * ratio * 10) / 10
      updated[index].fats = Math.round(originalItem.fats * ratio * 10) / 10
    }
    
    setItems(updated)
  }

  // Remove an item
  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
  }

  // Calculate totals
  const calculateTotals = () => {
    return items.reduce((totals, item) => ({
      calories: totals.calories + (item.calories || 0),
      protein: totals.protein + (item.protein || 0),
      carbs: totals.carbs + (item.carbs || 0),
      fats: totals.fats + (item.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
  }

  // Log all items
  const handleConfirm = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one food item')
      return
    }

    try {
      setSaving(true)

      // Log each item
      for (const item of items) {
        await nutritionApi.logFood({
          food_name: item.name,
          portion_grams: item.portion_grams,
          meal_type: mealType
        })
      }

      toast.success(`${items.length} items logged successfully!`)
      onConfirm()
    } catch (error) {
      console.error('Failed to log meal:', error)
      toast.error('Failed to save meal')
    } finally {
      setSaving(false)
    }
  }

  const totals = calculateTotals()
  // Get average confidence from items or from API response
  const avgConfidence = items.length > 0 
    ? items.reduce((sum, item) => sum + (item.confidence || 0), 0) / items.length
    : (analysisResult?.confidence_level || analysisResult?.nutrition_summary?.confidence || 0)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold">Confirm Your Meal</h2>
            <p className="text-green-100 text-sm mt-1">
              {avgConfidence > 0 ? `AI Confidence: ${(avgConfidence * 100).toFixed(0)}%` : 'Review detected items'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-green-600 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Confidence Warning */}
          {avgConfidence < 0.7 && avgConfidence > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-400">Low confidence detected</p>
                <p className="text-sm text-yellow-800 dark:text-yellow-500/80 mt-1">
                  Please verify portions are accurate. You can adjust them below.
                </p>
              </div>
            </div>
          )}

          {/* Meal Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Meal Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                    mealType === type
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Food Items */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Detected Foods</h3>
            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600">
                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-slate-300 font-medium">No foods detected</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  The AI couldn't identify any foods in this image. Try a clearer photo.
                </p>
              </div>
            ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {/* Food Name & Confidence */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {item.name}
                      </h4>
                      {item.detected_as && item.detected_as !== item.name && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Detected as: <span className="italic">{item.detected_as}</span>
                        </p>
                      )}
                      {item.confidence && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-32 bg-gray-300 dark:bg-slate-600 rounded-full h-2">
                            <div
                              className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                              style={{ width: `${item.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-500"
                      title="Remove this item"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Portion Size Adjustment */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                      Portion Size (grams)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updatePortion(
                            index,
                            item.portion_grams - 25
                          )
                        }
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={Math.round(item.portion_grams)}
                        onChange={(e) =>
                          updatePortion(index, parseInt(e.target.value) || 100)
                        }
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() =>
                          updatePortion(
                            index,
                            item.portion_grams + 25
                          )
                        }
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Nutrition Breakdown */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2">
                      <p className="font-semibold text-orange-900 dark:text-orange-400">
                        {item.calories || 0}
                      </p>
                      <p className="text-orange-800 dark:text-orange-500">cal</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                      <p className="font-semibold text-red-900 dark:text-red-400">
                        {(item.protein || 0).toFixed(1)}g
                      </p>
                      <p className="text-red-800 dark:text-red-500">Protein</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                      <p className="font-semibold text-blue-900 dark:text-blue-400">
                        {(item.carbs || 0).toFixed(1)}g
                      </p>
                      <p className="text-blue-800 dark:text-blue-500">Carbs</p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-400">
                        {(item.fats || 0).toFixed(1)}g
                      </p>
                      <p className="text-yellow-800 dark:text-yellow-500">Fats</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Total Summary */}
          {items.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700/50 dark:to-slate-700/30 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Meal Total</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {totals.calories}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Calories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {totals.protein.toFixed(1)}g
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Protein</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totals.carbs.toFixed(1)}g
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Carbs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {totals.fats.toFixed(1)}g
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Fats</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || items.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm & Log
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
