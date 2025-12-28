import { useKV } from '@github/spark/hooks'

export function useFavorites() {
  // Initialize with an empty array as the default value
  const [favorites, setFavorites] = useKV<string[]>('currency-favorites', [])

  const toggleFavorite = (currencyCode: string) => {
    setFavorites((current) => {
      // Ensure current is an array (safety check)
      const currentFavorites = current || []

      if (currentFavorites.includes(currencyCode)) {
        // If it exists, remove it
        return currentFavorites.filter(code => code !== currencyCode)
      } else {
        // If it doesn't exist, add it
        return [...currentFavorites, currencyCode]
      }
    })
  }

  const isFavorite = (currencyCode: string) => {
    return (favorites || []).includes(currencyCode)
  }

  const clearFavorites = () => {
    setFavorites([])
  }

  return {
    favorites: favorites || [],
    toggleFavorite,
    isFavorite,
    clearFavorites
  }
}