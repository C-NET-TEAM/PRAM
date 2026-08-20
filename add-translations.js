const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const newTranslations = {
  en: {
    profile: {
      title: "User Profile",
      desc: "Manage your personal information and preferences.",
      picture: "Profile Picture",
      pictureDesc: "PNG, JPG or GIF up to 5MB.",
      pictureUpload: "Click the camera icon to upload a custom photo.",
      fullName: "Full Name",
      email: "Email Address",
      bio: "Bio",
      bioPlaceholder: "Tell us a little bit about yourself...",
      save: "Save Changes",
      saving: "Saving..."
    }
  },
  hi: {
    profile: {
      title: "यूज़र प्रोफ़ाइल",
      desc: "अपनी व्यक्तिगत जानकारी और प्राथमिकताएं प्रबंधित करें।",
      picture: "प्रोफ़ाइल चित्र",
      pictureDesc: "PNG, JPG या GIF (अधिकतम 5MB)।",
      pictureUpload: "कस्टम फ़ोटो अपलोड करने के लिए कैमरा आइकन पर क्लिक करें।",
      fullName: "पूरा नाम",
      email: "ईमेल पता",
      bio: "परिचय",
      bioPlaceholder: "अपने बारे में कुछ बताएं...",
      save: "बदलाव सेव करें",
      saving: "सेव हो रहा है..."
    }
  },
  es: {
    profile: {
      title: "Perfil de Usuario",
      desc: "Administra tu información personal y preferencias.",
      picture: "Foto de perfil",
      pictureDesc: "PNG, JPG o GIF hasta 5MB.",
      pictureUpload: "Haz clic en el icono de la cámara para subir una foto personalizada.",
      fullName: "Nombre completo",
      email: "Correo electrónico",
      bio: "Biografía",
      bioPlaceholder: "Cuéntanos un poco sobre ti...",
      save: "Guardar Cambios",
      saving: "Guardando..."
    }
  },
  fr: {
    profile: {
      title: "Profil Utilisateur",
      desc: "Gérez vos informations personnelles et vos préférences.",
      picture: "Photo de profil",
      pictureDesc: "PNG, JPG ou GIF jusqu'à 5 Mo.",
      pictureUpload: "Cliquez sur l'icône de l'appareil photo pour télécharger une photo.",
      fullName: "Nom complet",
      email: "Adresse e-mail",
      bio: "Biographie",
      bioPlaceholder: "Parlez-nous un peu de vous...",
      save: "Enregistrer",
      saving: "Enregistrement..."
    }
  },
  de: {
    profile: {
      title: "Benutzerprofil",
      desc: "Verwalten Sie Ihre persönlichen Informationen.",
      picture: "Profilbild",
      pictureDesc: "PNG, JPG oder GIF bis 5MB.",
      pictureUpload: "Klicken Sie auf das Kamerasymbol für ein eigenes Foto.",
      fullName: "Vollständiger Name",
      email: "E-Mail-Adresse",
      bio: "Biografie",
      bioPlaceholder: "Erzählen Sie uns ein wenig über sich...",
      save: "Speichern",
      saving: "Speichern..."
    }
  },
  zh: {
    profile: {
      title: "用户主页",
      desc: "管理您的个人信息和偏好。",
      picture: "个人头像",
      pictureDesc: "PNG、JPG 或 GIF，最大 5MB。",
      pictureUpload: "点击相机图标上传自定义照片。",
      fullName: "全名",
      email: "电子邮件",
      bio: "个人简介",
      bioPlaceholder: "介绍一下您自己...",
      save: "保存更改",
      saving: "保存中..."
    }
  }
};

Object.keys(newTranslations).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    existing.profile = newTranslations[lang].profile;
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  }
});

console.log("Translations added.");
