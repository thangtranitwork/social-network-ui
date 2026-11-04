/**
 * Trả về họ tên chuẩn nhất quán cho toàn bộ ứng dụng PocPoc.
 * Quy chuẩn chuẩn hóa: Họ (familyName) trước, Tên (givenName) sau.
 * Ví dụ: familyName: "Le", givenName: "Nam" -> "Le Nam"
 *        familyName: "Nguyễn", givenName: "Văn A" -> "Nguyễn Văn A"
 * 
 * @param {Object} user Đối tượng chứa familyName, givenName, username
 * @returns {string} Họ và tên đã chuẩn hóa
 */
export const formatFullName = (user) => {
  if (!user) return "";
  const familyName = user.familyName?.trim() || "";
  const givenName = user.givenName?.trim() || "";

  const fullName = [familyName, givenName].filter(Boolean).join(" ");
  return fullName || user.username || "";
};

export default formatFullName;
