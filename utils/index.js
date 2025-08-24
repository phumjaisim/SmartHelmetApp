import haversine from 'haversine-distance';

// Cache for distance calculations
const distanceCache = new Map();
const CACHE_EXPIRY = 30000; // 30 seconds

/**
 * Calculate distance between two coordinates with caching
 * @param {Object} from - Starting coordinate {latitude, longitude}
 * @param {Object} to - Target coordinate {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (from, to) => {
  if (!from || !to || !from.latitude || !from.longitude || !to.latitude || !to.longitude) {
    return null;
  }

  const cacheKey = `${from.latitude},${from.longitude}-${to.latitude},${to.longitude}`;
  const now = Date.now();
  
  // Check cache first
  if (distanceCache.has(cacheKey)) {
    const cached = distanceCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_EXPIRY) {
      return cached.distance;
    }
    // Remove expired entry
    distanceCache.delete(cacheKey);
  }

  // Calculate new distance
  const fromPoint = { latitude: from.latitude, longitude: from.longitude };
  const toPoint = { latitude: parseFloat(to.latitude), longitude: parseFloat(to.longitude) };
  const distanceInMeters = haversine(fromPoint, toPoint);
  const distanceInKm = (distanceInMeters / 1000);
  const roundedDistance = Number(distanceInKm.toFixed(2));

  // Cache the result
  distanceCache.set(cacheKey, {
    distance: roundedDistance,
    timestamp: now
  });

  // Clean up old cache entries if cache gets too large
  if (distanceCache.size > 100) {
    const oldestKey = distanceCache.keys().next().value;
    distanceCache.delete(oldestKey);
  }

  return roundedDistance;
};

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Format status text and color based on helmet status
 * @param {string|number} status - Helmet status
 * @returns {Object} Status information with text and color
 */
export const formatHelmetStatus = (status) => {
  if (status === '0' || status === 0) {
    return { text: 'normal', color: 'green' };
  } else if (status === '1' || status === 1) {
    return { text: 'sos', color: 'red' };
  } else {
    return { text: 'offline', color: 'gray' };
  }
};

/**
 * Validate worker data structure
 * @param {Object} worker - Worker object to validate
 * @returns {Object} Validated and normalized worker object
 */
export const validateWorkerData = (worker) => {
  return {
    hatId: worker.hatId?.toString() || '',
    name: worker.name || '',
    role: worker.role || '',
    bloodType: worker.bloodType || '',
    nationality: worker.nationality || '',
    image: worker.image || '',
    age: worker.age || '',
    gender: worker.gender || '',
  };
};

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value to return if parsing fails
 * @returns {*} Parsed JSON or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return defaultValue;
  }
};

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Check if two objects are shallowly equal
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {boolean} True if objects are shallowly equal
 */
export const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
};

/**
 * Generate a simple hash code for a string
 * @param {string} str - String to hash
 * @returns {string} Hash code
 */
export const hashCode = (str) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
};

/**
 * Clear all caches
 */
export const clearCaches = () => {
  distanceCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    distanceCacheSize: distanceCache.size,
  };
};
