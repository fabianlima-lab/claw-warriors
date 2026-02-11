export function getFeaturesByTier(tier) {
  const features = {
    free: {
      web_search: false,
      doc_reading: false,
      url_summarizer: false,
      image_generation: false,
    },
    starter: {
      web_search: true,
      doc_reading: false,
      url_summarizer: false,
      image_generation: false,
    },
    pro: {
      web_search: true,
      doc_reading: true,
      url_summarizer: true,
      image_generation: true,
    },
    premium: {
      web_search: true,
      doc_reading: true,
      url_summarizer: true,
      image_generation: true,
    },
  };

  return features[tier] || features.free;
}

export function getEnergyAllocation(tier) {
  const allocations = {
    free: 0,
    starter: 500000,
    pro: 1000000,
    premium: 2000000,
  };
  return allocations[tier] || 0;
}
