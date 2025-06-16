const Feedback = require("../models/feedback.model");
const syncdb = (function () {
  Feedback.sync();
})();
