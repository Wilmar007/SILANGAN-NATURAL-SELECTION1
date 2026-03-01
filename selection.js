"use strict";

(() => {
  function survivalProbability(organism, environment) {
    let probability = 1;

    if (environment.wolvesEnabled) {
      probability *= organism.phenotype.fur === "dark" ? 0.45 : 0.15;
    }

    if (environment.toughFoodEnabled) {
      probability *= organism.phenotype.teeth === "long" ? 0.86 : 0.44;
    }

    if (environment.limitedFoodEnabled) {
      probability *= 0.72;
    }

    return Math.max(0.03, Math.min(0.98, probability));
  }

  function applySurvival(population, environment) {
    return population.filter((organism) => Math.random() < survivalProbability(organism, environment));
  }

  window.SelectionModule = {
    survivalProbability,
    applySurvival
  };
})();
