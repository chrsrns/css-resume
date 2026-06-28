const { merge } = require("webpack-merge");
const common = require("./webpack.common.cjs");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    liveReload: true,
    hot: true,
    open: true,
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
    ],
    static: {
      directory: "./",
      publicPath: "/css-resume/",
    },
  },
});
