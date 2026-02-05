 // Haptic feedback hook for mobile devices
 export const useHaptics = () => {
   const vibrate = (pattern: number | number[] = 10) => {
     if ('vibrate' in navigator) {
       try {
         navigator.vibrate(pattern);
       } catch (e) {
         // Silently fail if vibration is not supported
       }
     }
   };
 
   const lightTap = () => vibrate(10);
   const mediumTap = () => vibrate(25);
   const heavyTap = () => vibrate(50);
   const success = () => vibrate([10, 50, 10]);
   const error = () => vibrate([50, 100, 50]);
 
   return { vibrate, lightTap, mediumTap, heavyTap, success, error };
 };