// This component renders a script tag that Next.js will include in the <head>
// It runs immediately on page load, before hydration, to set the theme
export function ThemeScript() {
  return (
    <script
      id="theme-script"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function getThemePreference() {
              if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                return localStorage.getItem('theme');
              }
              return window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            }
            
            const theme = getThemePreference();
            
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
          })();
        `,
      }}
    />
  );
}