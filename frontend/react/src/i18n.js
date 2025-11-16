// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // Dùng HttpApi để tải file translation từ thư mục /public/locales
  .use(HttpApi)
  // Tự động phát hiện ngôn ngữ (ví dụ: từ localStorage)
  .use(LanguageDetector)
  // Kết nối i18n với React
  .use(initReactI18next)
  .init({
    // Ngôn ngữ mặc định
    lng: 'vi', 
    // Ngôn ngữ dự phòng nếu không tìm thấy key
    fallbackLng: 'vi',
    debug: false, // Bật/tắt console log
    
    // Nơi lưu trữ lựa chọn của người dùng
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },

    // Các namespace (nếu bạn muốn chia nhỏ file dịch)
    ns: ['translation'],
    defaultNS: 'translation',

    interpolation: {
      escapeValue: false, // React đã tự chống XSS
    },

    // Cấu hình cho backend (HttpApi)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;