import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Este proyecto no incluye eslint-plugin-react, así que la regla base
      // no reconoce el uso de un identificador dentro de JSX. Por eso se
      // ignoran los nombres en mayúscula (componentes), tanto en variables
      // como en parámetros: si no, marca como "sin usar" componentes que sí
      // se están renderizando.
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^[A-Z_]|^_',
      }],

      // Cargar datos al montar la pantalla y guardar el resultado en estado
      // es el patrón que usa toda la app. La regla lo señala igual, así que
      // queda como aviso: sirve para revisarlo, pero no frena la compilación.
      'react-hooks/set-state-in-effect': 'warn',

      // Solo afecta al refresco instantáneo mientras se programa. Varios
      // archivos exportan el componente y su hook asociado a propósito
      // (por ejemplo el contexto de sesión), que es lo habitual.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
