import { Configuration } from 'webpack';
import { override } from 'customize-cra';
import TerserPlugin from 'terser-webpack-plugin';

const customizeConfig = override((config: Configuration) => {
  // Configurer l'optimisation avec TerserPlugin pour la minification
  if (config.mode === "production") {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              ecma: 5,
              comparisons: false,
              inline: 2,
              drop_console: true,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
          extractComments: false,
          parallel: true,
        }),
        ...(config.optimization?.minimizer || []),
      ],
    };
  }
  return config;
});

export default customizeConfig;
