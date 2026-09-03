/* Algolassi Tutorial Quiz - diminishing rewards */
(function () {
  "use strict";

  var REWARDS = [3, 2, 1];
  var ATTEMPT_ATTR = "data-algolassi-quiz-attempts";

  function rewardForAttempts(attempts) {
    attempts = Math.max(1, Number(attempts) || 1);
    return REWARDS[Math.min(attempts, REWARDS.length) - 1];
  }

  function getQuizFromTarget(target) {
    if (!target || !target.closest) return null;
    return target.closest(".algolassi-tutorial-quiz");
  }

  function recordAttempt(quiz) {
    if (!quiz) return;
    var input = quiz.querySelector(".algolassi-tutorial-quiz-input");
    if (!input || !String(input.value || "").trim()) return;

    var attempts = Number(quiz.getAttribute(ATTEMPT_ATTR)) || 0;
    attempts += 1;
    quiz.setAttribute(ATTEMPT_ATTR, String(attempts));
  }

  document.addEventListener("click", function (event) {
    var button = event.target && event.target.closest
      ? event.target.closest(".algolassi-tutorial-quiz-button")
      : null;
    if (button) recordAttempt(getQuizFromTarget(button));
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    var input = event.target && event.target.closest
      ? event.target.closest(".algolassi-tutorial-quiz-input")
      : null;
    if (input) recordAttempt(getQuizFromTarget(input));
  }, true);

  function patchClient(client) {
    if (!client || typeof client.rpc !== "function" || client.__algolassiQuizRewardsPatched) return;

    var originalRpc = client.rpc.bind(client);
    client.rpc = function (functionName, args, options) {
      if (functionName === "award_tutorial_quiz_reputation") {
        var quiz = document.querySelector("#algolassi-tutorial-quiz-host .algolassi-tutorial-quiz");
        var attempts = quiz ? (Number(quiz.getAttribute(ATTEMPT_ATTR)) || 1) : 1;
        var points = rewardForAttempts(attempts);

        args = Object.assign({}, args || {}, { p_points: points });
        client.__algolassiQuizRewardPoints = points;
      }

      return originalRpc(functionName, args, options);
    };

    client.__algolassiQuizRewardsPatched = true;
  }

  function patchExistingClient() {
    try {
      patchClient(window.AlgolassiSupabase);
    } catch (e) {}
  }

  window.setInterval(patchExistingClient, 250);
  patchExistingClient();

  window.addEventListener("algolassi:tutorial-quiz-correct", function (event) {
    var quiz = document.querySelector("#algolassi-tutorial-quiz-host .algolassi-tutorial-quiz");
    if (!quiz) return;

    var attempts = Number(quiz.getAttribute(ATTEMPT_ATTR)) || 1;
    var points = rewardForAttempts(attempts);
    var result = quiz.querySelector(".algolassi-tutorial-quiz-result");
    if (result && event.detail && event.detail.points > 0) {
      result.textContent = "Correct! +" + points + " reputation";
    }
  });
})();
