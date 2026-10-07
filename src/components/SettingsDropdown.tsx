import { useEffect, useRef, useState } from "react";

interface SettingsDropdownProps {
  role: "provider" | "customer";
  defaultName?: string;
  onUpdate?: () => void;
}

export const SettingsDropdown = ({ role, defaultName = "", onUpdate }: SettingsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeKey = `${role}_theme`;
  const nameKey = `${role}_display_name`;
  const profileKey = `${role}_profile_image`;

  useEffect(() => {
    const savedTheme = (localStorage.getItem(themeKey) || localStorage.getItem("provider_theme") || "dark") as "dark" | "light";
    const savedName = localStorage.getItem(nameKey) || defaultName;
    const savedProfile = localStorage.getItem(profileKey) || "";

    setTheme(savedTheme);
    setName(savedName);
    setProfileImage(savedProfile);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, [role, defaultName, themeKey, nameKey, profileKey]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    setTheme(t);
    localStorage.setItem(themeKey, t);
    localStorage.setItem("provider_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const handleSaveName = () => {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(nameKey, trimmed);
    }
    setIsOpen(false);
    onUpdate?.();
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setProfileImage(result);
      localStorage.setItem(profileKey, result);
      onUpdate?.();
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileImage("");
    localStorage.removeItem(profileKey);
    onUpdate?.();
  };

  const initialLetter = (name.trim() || defaultName || (role === "provider" ? "P" : "C")).charAt(0).toUpperCase();

  return (
    <div className="settings-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="settings-gear-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Settings"
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="settings-dropdown">
          <div className="settings-section-title">Settings</div>

          {/* Profile Photo */}
          <div className="settings-section">
            <label className="settings-label">Profile Photo</label>
            <div className="settings-avatar-row">
              <div className="settings-avatar-preview">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <label className="settings-upload-btn">
                📁 Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleUploadPhoto}
                />
              </label>
              {profileImage && (
                <button
                  type="button"
                  className="settings-remove-btn"
                  onClick={handleRemovePhoto}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Edit Name */}
          <div className="settings-section">
            <label className="settings-label">Display Name</label>
            <div className="settings-name-row">
              <input
                type="text"
                className="settings-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <button
                type="button"
                className="settings-save-btn"
                onClick={handleSaveName}
              >
                Save
              </button>
            </div>
          </div>

          {/* Dark / Light Mode */}
          <div className="settings-section">
            <label className="settings-label">Theme</label>
            <div className="settings-theme-row">
              <button
                type="button"
                className={`settings-theme-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => applyTheme("dark")}
              >
                🌙 Dark
              </button>
              <button
                type="button"
                className={`settings-theme-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => applyTheme("light")}
              >
                ☀️ Light
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
