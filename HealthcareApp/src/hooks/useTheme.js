import { useTheme } from '../context/ThemeContext';

// Hook personalizado para facilitar o uso de cores do tema
export const useThemeColors = () => {
    const { colors } = useTheme();
    return colors;
};

// Hook personalizado para obter cores específicas
export const useThemeColor = (colorKey) => {
    const colors = useThemeColors();
    return colors[colorKey] || colors.text;
};

// Hook personalizado para estilos baseados no tema
export const useThemeStyles = (baseStyles) => {
    const colors = useThemeColors();

    // Função para aplicar cores do tema aos estilos
    const applyThemeColors = (styles) => {
        if (!styles) return {};

        const themedStyles = { ...styles };

        // Mapeamento de propriedades de cor para o tema
        const colorMappings = {
            backgroundColor: 'background',
            color: 'text',
            borderColor: 'border',
            borderTopColor: 'border',
            borderBottomColor: 'border',
            borderLeftColor: 'border',
            borderRightColor: 'border',
        };

        Object.keys(colorMappings).forEach(styleProp => {
            if (themedStyles[styleProp] && typeof themedStyles[styleProp] === 'string') {
                // Se for uma chave do tema, substitua pela cor correspondente
                if (colors[themedStyles[styleProp]]) {
                    themedStyles[styleProp] = colors[themedStyles[styleProp]];
                }
            }
        });

        return themedStyles;
    };

    return applyThemeColors(baseStyles);
};