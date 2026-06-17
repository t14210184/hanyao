/**
 * Client-side form validation helper
 */
(function() {
  function validateContactForm(name, phone, service) {
    if (!name || name.trim() === '') {
      return { valid: false, message: '請填寫聯絡姓名' };
    }
    if (!phone || phone.trim() === '') {
      return { valid: false, message: '請填寫聯絡電話' };
    }
    // Basic phone validation (at least 8 digits)
    const cleanPhone = phone.replace(/[- ]/g, '');
    if (cleanPhone.length < 8) {
      return { valid: false, message: '請填寫正確的聯絡電話格式' };
    }
    if (!service || service === '') {
      return { valid: false, message: '請選擇您需要的服務項目' };
    }
    return { valid: true };
  }

  // Export to window
  if (typeof window !== 'undefined') {
    window.validateContactForm = validateContactForm;
  }
})();
