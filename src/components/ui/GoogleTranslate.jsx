import { useEffect } from "react";
import { Dropdown, Menu } from "antd";
import { GlobalOutlined } from "@ant-design/icons";

const languages = [
  { key: "en", label: "English" },
  { key: "ar", label: "Arabic" },
  { key: "pt", label: "Portuguese" },
  { key: "fr", label: "French" },
];

const GoogleTranslateAntd = () => {
  useEffect(() => {
    if (window.google?.translate) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ar,pt,fr",
          autoDisplay: false,
        },
        "google_translate_hidden"
      );
    };

    const script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const changeLanguage = ({ key }) => {
    const select = document.querySelector(".goog-te-combo");
    if (!select) return;

    select.value = key;
    select.dispatchEvent(new Event("change"));
  };

  const menu = (
    <Menu onClick={changeLanguage}>
      {languages.map((lang) => (
        <Menu.Item key={lang.key}>
          {lang.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <>
      {/* Hidden Google Translate Element */}
      <div id="google_translate_hidden" style={{ display: "none" }} />

      {/* AntD Dropdown */}
      <Dropdown overlay={menu} placement="bottomRight" trigger={["click"]}>
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "#1f1f1f",
          }}
        >
          <GlobalOutlined style={{ fontSize: 18 }} />
          <span>Language</span>
        </div>
      </Dropdown>
    </>
  );
};

export default GoogleTranslateAntd;
