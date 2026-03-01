"use strict";

(() => {
  const TRAIT_CONFIG = {
    fur: { dominantAllele: "F", recessiveAllele: "f", dominantPhenotype: "dark", recessivePhenotype: "light" },
    ears: { dominantAllele: "E", recessiveAllele: "e", dominantPhenotype: "straight", recessivePhenotype: "floppy" },
    teeth: { dominantAllele: "T", recessiveAllele: "t", dominantPhenotype: "long", recessivePhenotype: "short" }
  };

  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function randomAllelePair(traitKey) {
    const cfg = TRAIT_CONFIG[traitKey];
    return [
      Math.random() < 0.5 ? cfg.dominantAllele : cfg.recessiveAllele,
      Math.random() < 0.5 ? cfg.dominantAllele : cfg.recessiveAllele
    ];
  }

  function pairToString(pair) {
    const sorted = [...pair].sort((a, b) => a.localeCompare(b));
    return `${sorted[0]}${sorted[1]}`;
  }

  function phenotypeFromPair(traitKey, pair, dominantMode) {
    const cfg = TRAIT_CONFIG[traitKey];

    if (dominantMode) {
      const hasDominant = pair.includes(cfg.dominantAllele);
      return hasDominant ? cfg.dominantPhenotype : cfg.recessivePhenotype;
    }

    return pair[0] === cfg.dominantAllele ? cfg.dominantPhenotype : cfg.recessivePhenotype;
  }

  function createRandomGenotype() {
    return {
      fur: randomAllelePair("fur"),
      ears: randomAllelePair("ears"),
      teeth: randomAllelePair("teeth")
    };
  }

  function phenotypeFromGenotype(genotype, dominantMode) {
    return {
      fur: phenotypeFromPair("fur", genotype.fur, dominantMode),
      ears: phenotypeFromPair("ears", genotype.ears, dominantMode),
      teeth: phenotypeFromPair("teeth", genotype.teeth, dominantMode)
    };
  }

  function traitToPair(traitKey, phenotype) {
    const cfg = TRAIT_CONFIG[traitKey];
    if (phenotype === cfg.dominantPhenotype) {
      return Math.random() < 0.5
        ? [cfg.dominantAllele, cfg.dominantAllele]
        : [cfg.dominantAllele, cfg.recessiveAllele];
    }
    return [cfg.recessiveAllele, cfg.recessiveAllele];
  }

  function applyRareMutation(genotype, mutationEnabled) {
    if (!mutationEnabled || Math.random() >= 0.01) return genotype;

    const traits = ["fur", "ears", "teeth"];
    const traitKey = randomChoice(traits);
    const idx = Math.random() < 0.5 ? 0 : 1;
    const cfg = TRAIT_CONFIG[traitKey];

    genotype[traitKey][idx] = genotype[traitKey][idx] === cfg.dominantAllele
      ? cfg.recessiveAllele
      : cfg.dominantAllele;

    return genotype;
  }

  function mate(parentA, parentB, options) {
    const mutationEnabled = !!options?.mutationEnabled;

    const child = {
      fur: [randomChoice(parentA.genotype.fur), randomChoice(parentB.genotype.fur)],
      ears: [randomChoice(parentA.genotype.ears), randomChoice(parentB.genotype.ears)],
      teeth: [randomChoice(parentA.genotype.teeth), randomChoice(parentB.genotype.teeth)]
    };

    return applyRareMutation(child, mutationEnabled);
  }

  function genotypeLabel(genotype) {
    return {
      fur: pairToString(genotype.fur),
      ears: pairToString(genotype.ears),
      teeth: pairToString(genotype.teeth)
    };
  }

  window.GeneticsModule = {
    TRAIT_CONFIG,
    createRandomGenotype,
    phenotypeFromGenotype,
    traitToPair,
    mate,
    genotypeLabel
  };
})();
