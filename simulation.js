"use strict";

(() => {
  const MIN_POPULATION = 1;
  const MAX_POPULATION = 200;
  const OFFSPRING_PER_GENERATION = 2;
  const STEP_MS = 2000;

  let generation = 0;
  let population = [];
  let simulationInterval = null;
  let hasShownZeroPopulationAlert = false;
  let previousSnapshotTotal = null;

  function emitPopulationChanged(reason = "update") {
    window.dispatchEvent(new CustomEvent("simulation:population-changed", {
      detail: {
        reason,
        generation,
        populationCount: population.length
      }
    }));
  }

  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function setStatusMessage(message) {
    const generationNode = document.getElementById("generationValue");
    if (generationNode) generationNode.title = message;
    const statusNode = document.getElementById("statusMessage");
    if (statusNode) statusNode.textContent = message;
    console.log(`[Simulation] ${message}`);
  }

  function percent(value, total) {
    if (!total || total <= 0) return 0;
    return Math.round((value / total) * 100);
  }

  function trendText(currentTotal) {
    if (previousSnapshotTotal == null) return "starting state";
    if (currentTotal > previousSnapshotTotal) return `increased by ${currentTotal - previousSnapshotTotal}`;
    if (currentTotal < previousSnapshotTotal) return `decreased by ${previousSnapshotTotal - currentTotal}`;
    return "stayed the same";
  }

  function dominantTraitText(snapshot) {
    const furWinner = snapshot.lightFur >= snapshot.darkFur ? "light fur" : "dark fur";
    const earWinner = snapshot.straightEars >= snapshot.floppyEars ? "straight ears" : "floppy ears";
    const teethWinner = snapshot.shortTeeth >= snapshot.longTeeth ? "short teeth" : "long teeth";
    return `${furWinner}, ${earWinner}, ${teethWinner}`;
  }

  function renderGenerationResult(note = "") {
    const snapshot = getPopulationSnapshot();
    const list = document.getElementById("generationResultsList");
    const current = document.getElementById("generationSummaryCurrent");
    if (!list || !current) return;

    const total = snapshot.total;
    const lightPct = percent(snapshot.lightFur, total);
    const darkPct = percent(snapshot.darkFur, total);
    const longTeethPct = percent(snapshot.longTeeth, total);
    const trend = trendText(total);
    const dominantTraits = dominantTraitText(snapshot);
    const noteSuffix = note ? ` ${note}` : "";

    current.textContent = `Generation ${snapshot.generation}: ${total} rabbits (${trend}).${noteSuffix}`;

    let item = list.querySelector(`[data-generation='${snapshot.generation}']`);
    if (!item) {
      item = document.createElement("div");
      item.className = "result-item";
      item.dataset.generation = String(snapshot.generation);
      list.prepend(item);
    }

    item.innerHTML = `<strong>Generation ${snapshot.generation}</strong> — Total: ${total}. Light fur: ${snapshot.lightFur} (${lightPct}%), Dark fur: ${snapshot.darkFur} (${darkPct}%), Long teeth: ${snapshot.longTeeth} (${longTeethPct}%). Dominant visible traits: ${dominantTraits}.${noteSuffix ? ` Note: ${note}` : ""}`;
    previousSnapshotTotal = total;
  }

  function showExtinctionPopup(message) {
    if (hasShownZeroPopulationAlert) return;
    hasShownZeroPopulationAlert = true;
    window.alert(message);
  }

  function clearExtinctionGuardIfRecovered() {
    if (population.length > 0) {
      hasShownZeroPopulationAlert = false;
    }
  }

  function extinctionMessageForReason(reason) {
    if (reason === "wolf-predation") return "All rabbits were eaten by wolves. No rabbits left.";
    if (reason === "food-starvation") return "All rabbits died due to food conditions. No rabbits left.";
    return "All rabbits died out. No rabbits left.";
  }

  function extinctionMessageFromEnvironment() {
    const env = environmentState();
    if (env.wolvesEnabled) return "All rabbits were eaten by wolves. No rabbits left.";
    if (env.limitedFoodEnabled && env.toughFoodEnabled) return "All rabbits died due to limited + tough food conditions. No rabbits left.";
    if (env.limitedFoodEnabled) return "All rabbits died due to limited food. No rabbits left.";
    if (env.toughFoodEnabled) return "All rabbits died due to tough food. No rabbits left.";
    return "All rabbits died out. No rabbits left.";
  }

  function environmentState() {
    return {
      wolvesEnabled: isChecked("wolvesToggle"),
      toughFoodEnabled: isChecked("toughFoodToggle"),
      limitedFoodEnabled: isChecked("limitedFoodToggle")
    };
  }

  function createOrganismFromGenotype(genotype, parentIds = [], generationBorn = generation) {
    const dominantMode = window.UIModule?.isDominantMode?.() ?? true;
    const phenotype = window.GeneticsModule.phenotypeFromGenotype(genotype, dominantMode);
    const genotypeLabel = window.GeneticsModule.genotypeLabel(genotype);

    return {
      id: `org-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      genotype,
      genotypeLabel,
      phenotype,
      parentIds,
      generationBorn
    };
  }

  function refreshPhenotypesForMode() {
    const dominantMode = window.UIModule?.isDominantMode?.() ?? true;
    population = population.map((org) => {
      const phenotype = window.GeneticsModule.phenotypeFromGenotype(org.genotype, dominantMode);
      return {
        ...org,
        phenotype,
        genotypeLabel: window.GeneticsModule.genotypeLabel(org.genotype)
      };
    });
  }

  function createInitialPopulation() {
    const genotype = window.GeneticsModule.createRandomGenotype();
    population = [createOrganismFromGenotype(genotype, [], 0)];

    window.PedigreeModule?.reset?.(population, 0);
    clearExtinctionGuardIfRecovered();
    previousSnapshotTotal = null;
    setStatusMessage("Generation 0: one rabbit initialized. Add a mate to begin reproduction.");
    emitPopulationChanged("initial");
    renderGenerationResult("Start with one rabbit. Add a mate to begin reproduction.");
  }

  function isChecked(id) {
    return !!document.getElementById(id)?.checked;
  }

  function applySurvival() {
    return window.SelectionModule.applySurvival(population, environmentState());
  }

  function reproducePopulation(survivors, targetPopulationSize) {
    const mutationEnabled = window.UIModule?.isMutationMode?.() ?? false;
    const next = [...survivors];

    while (next.length < targetPopulationSize) {
      const parentA = randomChoice(survivors);
      const parentB = randomChoice(survivors);

      const childGenotype = window.GeneticsModule.mate(parentA, parentB, { mutationEnabled });
      const child = createOrganismFromGenotype(childGenotype, [parentA.id, parentB.id], generation + 1);
      next.push(child);
    }

    population = next;
    clearExtinctionGuardIfRecovered();
    window.PedigreeModule?.registerGeneration?.(population, generation + 1);
  }

  function getPopulationSnapshot() {
    const lightFur = population.filter((org) => org.phenotype.fur === "light").length;
    const darkFur = population.length - lightFur;
    const straightEars = population.filter((org) => org.phenotype.ears === "straight").length;
    const floppyEars = population.length - straightEars;
    const shortTeeth = population.filter((org) => org.phenotype.teeth === "short").length;
    const longTeeth = population.length - shortTeeth;

    return {
      generation,
      total: population.length,
      lightFur,
      darkFur,
      straightEars,
      floppyEars,
      shortTeeth,
      longTeeth,
      population: population.length
    };
  }

  function updateGenerationDisplay() {
    const node = document.getElementById("generationValue");
    if (node) node.textContent = String(generation);
  }

  function updateGraph() {
    if (!window.GraphModule) return;
    window.GraphModule.push(getPopulationSnapshot());
    window.UIModule?.drawTraitPie?.(getPopulationSnapshot());
  }

  function runGeneration() {
    refreshPhenotypesForMode();
    if (population.length < 2) {
      pauseSimulation();
      setStatusMessage("Add a mate to begin reproduction.");
      return;
    }

    const survivors = applySurvival();
    const env = environmentState();
    if (survivors.length === 0) {
      population = [];
      generation += 1;
      updateGenerationDisplay();
      updateGraph();
      pauseSimulation();

      const extinctionMessage = env.wolvesEnabled
        ? "All rabbits were eaten by wolves. No rabbits left."
        : (env.limitedFoodEnabled || env.toughFoodEnabled)
          ? "All rabbits died due to food conditions. No rabbits left."
          : "All rabbits died out. No rabbits left.";

      setStatusMessage(extinctionMessage);
      showExtinctionPopup(extinctionMessage);
      emitPopulationChanged("extinction");
      renderGenerationResult("Extinction event occurred.");
      return;
    }

    if (survivors.length < 2) {
      population = survivors.length > 0 ? survivors : [population[0]];
      generation += 1;
      updateGenerationDisplay();
      updateGraph();
      pauseSimulation();
      setStatusMessage("Population dropped below two breeders. Add a mate to continue.");
      renderGenerationResult("Too few breeders to continue automatically.");
      return;
    }

    const growthTarget = Math.min(MAX_POPULATION, survivors.length + OFFSPRING_PER_GENERATION);
    reproducePopulation(survivors, growthTarget);

    generation += 1;
    updateGenerationDisplay();
    updateGraph();
    emitPopulationChanged("generation-step");
    renderGenerationResult("Natural selection and reproduction completed.");
  }

  function startSimulation() {
    if (simulationInterval) return;
    if (population.length < 2) {
      window.alert("Add a mate to begin reproduction.");
      setStatusMessage("Add a mate to begin reproduction.");
      return;
    }
    simulationInterval = window.setInterval(runGeneration, STEP_MS);
    setStatusMessage("Simulation running.");
  }

  function pauseSimulation() {
    if (!simulationInterval) return;
    window.clearInterval(simulationInterval);
    simulationInterval = null;
    setStatusMessage("Simulation paused.");
  }

  function resetSimulation() {
    pauseSimulation();
    generation = 0;
    createInitialPopulation();
    refreshPhenotypesForMode();
    updateGenerationDisplay();
    if (window.GraphModule) {
      window.GraphModule.reset(getPopulationSnapshot());
    }
    window.UIModule?.drawTraitPie?.(getPopulationSnapshot());
    emitPopulationChanged("reset");
    renderGenerationResult("Simulation reset to baseline.");
  }

  function selectedTrait(name) {
    const node = document.querySelector(`input[name='${name}']:checked`);
    return node ? node.value : null;
  }

  function addMate() {
    if (population.length >= MAX_POPULATION) return;

    const selected = {
      fur: selectedTrait("furSelection") || "light",
      ears: selectedTrait("earsSelection") || "straight",
      teeth: selectedTrait("teethSelection") || "short"
    };

    const mateGenotype = {
      fur: window.GeneticsModule.traitToPair("fur", selected.fur),
      ears: window.GeneticsModule.traitToPair("ears", selected.ears),
      teeth: window.GeneticsModule.traitToPair("teeth", selected.teeth)
    };

    const mate = createOrganismFromGenotype(mateGenotype, [], generation);
    population.push(mate);
    clearExtinctionGuardIfRecovered();
    window.PedigreeModule?.registerGeneration?.(population, generation);

    if (population.length >= 2) {
      setStatusMessage("Mate added. Press Play to begin reproduction.");
    }

    if (window.GraphModule) window.GraphModule.redraw();
    window.UIModule?.drawTraitPie?.(getPopulationSnapshot());
    emitPopulationChanged("add-mate");
    renderGenerationResult("Mate added manually by student.");
  }

  function removeOrganismById(organismId, reason = "predation") {
    if (!organismId) return false;
    const before = population.length;
    population = population.filter((item) => item.id !== organismId);
    if (population.length === before) return false;

    if (window.GraphModule) window.GraphModule.redraw();
    window.UIModule?.drawTraitPie?.(getPopulationSnapshot());
    emitPopulationChanged(reason);

    if (population.length === 0) {
      pauseSimulation();
      const extinctionMessage = extinctionMessageForReason(reason);
      setStatusMessage(extinctionMessage);
      showExtinctionPopup(extinctionMessage);
      renderGenerationResult("Extinction event occurred.");
    }

    return true;
  }

  function ensureExtinctionNotice(reason) {
    if (population.length > 0) {
      clearExtinctionGuardIfRecovered();
      return;
    }

    const message = reason ? extinctionMessageForReason(reason) : extinctionMessageFromEnvironment();
    pauseSimulation();
    setStatusMessage(message);
    showExtinctionPopup(message);
    renderGenerationResult("Extinction event occurred.");
  }

  function bindControls() {
    document.getElementById("playBtn")?.addEventListener("click", startSimulation);
    document.getElementById("pauseBtn")?.addEventListener("click", pauseSimulation);
    document.getElementById("resetBtn")?.addEventListener("click", resetSimulation);
    document.getElementById("addMateBtn")?.addEventListener("click", addMate);

    document.getElementById("dominantModeToggle")?.addEventListener("change", () => {
      refreshPhenotypesForMode();
      window.GraphModule?.redraw();
      window.UIModule?.drawTraitPie?.(getPopulationSnapshot());
    });
  }

  window.SimulationModule = {
    init() {
      createInitialPopulation();
      updateGenerationDisplay();
      bindControls();

      if (window.GraphModule) {
        window.GraphModule.reset(getPopulationSnapshot());
      }
      window.UIModule?.drawTraitPie?.(getPopulationSnapshot());
      emitPopulationChanged("init");
    },
    getPopulation() {
      return population.slice();
    },
    getGeneration() {
      return generation;
    },
    getPopulationSnapshot() {
      return getPopulationSnapshot();
    },
    removeOrganismById(organismId, reason) {
      return removeOrganismById(organismId, reason);
    },
    ensureExtinctionNotice(reason) {
      ensureExtinctionNotice(reason);
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    window.SimulationModule.init();
  });
})();
