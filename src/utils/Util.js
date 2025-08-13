export const isIOS = () => {
  if (typeof navigator !== "undefined" && typeof window !== "undefined") {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/iPad/.test(userAgent)) {
      return true;
    } else if (/iPhone/.test(userAgent)) {
      return true;
    } else if (/iPod/.test(userAgent)) {
      return true;
    } else if (/Macintosh/.test(userAgent) && 'ontouchend' in document) {
      // Check for iPadOS devices, which identify as "Macintosh" in userAgent
      return true;
    }
  }
  return false;
};

export const getDeviceType = () => {
  if (typeof navigator !== "undefined" && typeof window !== "undefined") {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/iPad/.test(userAgent)) {
      return "iPad";
    } else if (/iPhone/.test(userAgent)) {
      return "iPhone";
    } else if (/iPod/.test(userAgent)) {
      return "iPod";
    } else if (/Macintosh/.test(userAgent) && 'ontouchend' in document) {
      // Check for iPadOS devices, which identify as "Macintosh" in userAgent
      return "iPad";
    }
  }
  return "Not iOS";
};