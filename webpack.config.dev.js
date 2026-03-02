const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

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
      },
    ],
    static: {
      directory: "./",
      publicPath: "/css-resume/",
    },
  },
});
