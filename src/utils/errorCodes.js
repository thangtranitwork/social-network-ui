/**
 * Hệ thống mã lỗi và xử lý lỗi từ API (social-network-go)
 * Kết hợp với i18n để hiển thị thông báo đa ngôn ngữ
 */

/**
 * Phân tích lỗi từ API và trả về mã lỗi hoặc thông báo lỗi đã được dịch
 * @param {Error} error - Lỗi từ API (thường là lỗi từ axios)
 * @param {Function} t - Hàm translate (t) thường từ useTranslations('error')
 * @returns {string} Mã lỗi hoặc thông báo lỗi đã được dịch
 */
export function parseApiError(error, t) {
  let errorCode = 'unknown';

  if (error.response) {
    const { data, status } = error.response;
    
    // 1. Ưu tiên mã lỗi tùy chỉnh từ backend
    if (data && data.code) {
      errorCode = data.code.toString();
    } else {
      // 2. Fallback sang HTTP status code
      errorCode = `http${status}`;
    }
  } else if (error.request) {
    // 3. Lỗi network
    errorCode = 'networkError';
  } else if (error.message) {
    // 4. Lỗi khác có message
    return error.message;
  }

  // Nếu có hàm translate, sử dụng nó để lấy message từ namespace 'error'
  if (t) {
    try {
      // Thử dịch mã lỗi
      return t(errorCode);
    } catch (e) {
      // Nếu không dịch được, trả về message từ server hoặc mã lỗi
      return error.response?.data?.message || errorCode;
    }
  }

  return errorCode;
}

/**
 * Kiểm tra xem có phải lỗi xác thực (401 hoặc mã lỗi auth)
 */
export function isAuthenticationError(error) {
  if (!error.response) return false;
  const { status, data } = error.response;
  const authErrorCodes = [1001, 1003, 1011, 1013, 1014, 2009, 9997];
  return status === 401 || (data?.code && authErrorCodes.includes(data.code));
}

/**
 * Kiểm tra xem có phải lỗi validation
 */
export function isValidationError(error) {
  if (!error.response) return false;
  const { status, data } = error.response;
  const validationErrorCodes = [
    1004, 1005, 1006, 1007, 1015,
    2000, 2001, 2002, 2003, 2004, 2005, 2011, 2013,
    3001, 3002, 3007, 3008, 3009, 3010,
    5000, 5001, 5002,
    6001, 6002, 6003, 6004,
    7001, 7002, 7006, 7010,
    9000, 9993, 9995, 9996
  ];
  return status === 400 || status === 422 || (data?.code && validationErrorCodes.includes(data.code));
}
