export const THEME_STORAGE_KEY = "sparekart-site-theme";

export const themeBootstrapScript = `(function(){try{var key="${THEME_STORAGE_KEY}";var savedTheme=window.localStorage.getItem(key);var theme=savedTheme==="dark"||savedTheme==="light"?savedTheme:"light";document.documentElement.dataset.theme=theme;document.body.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){}})();`;
