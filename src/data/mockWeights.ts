import type { WeightConfig } from "@/types";

export const mockWeights: WeightConfig = {
  practice_head: {
    role: "practice_head",
    weights: {
      "FH-01": 0.20, "FH-08": 0.15, "FH-09": 0.10, "FH-10": 0.10,
      "FH-11": 0.20, "CM-03": 0.10, "GP-01": 0.05, "GP-07": 0.05,
      "BD-03": 0.03, "PO-01": 0.02,
    },
  },
  partner: {
    role: "partner",
    weights: {
      "FH-01": 0.20, "FH-02": 0.15, "FH-08": 0.15, "FH-09": 0.10,
      "CM-02": 0.05, "CM-03": 0.10, "GP-04": 0.05, "GP-07": 0.10,
      "PO-05": 0.05, "BD-06": 0.05,
    },
  },
  associate: {
    role: "associate",
    weights: {
      "FH-01": 0.25, "FH-08": 0.20, "FH-09": 0.20, "FH-13": 0.10,
      "FH-19": 0.05, "CM-02": 0.05, "CM-09": 0.05, "GP-07": 0.05,
      "PO-06": 0.03, "BD-06": 0.02,
    },
  },
};

export default mockWeights;