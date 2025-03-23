import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  safelist: [
    'bg-white',
    'dark:bg-gray-800',
    'bg-gray-50',
    'dark:bg-gray-700',
    'bg-indigo-50',
    'bg-indigo-600',
  ],
  plugins: [
    forms,
  ],
  corePlugins: {
    backgroundColor: true,
  },
}
