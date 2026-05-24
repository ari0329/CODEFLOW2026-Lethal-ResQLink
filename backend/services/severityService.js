"use strict";

const TYPE_W = {
    earthquake: 35, collapse: 35, flood: 30, fire: 28, violence: 25, landslide: 25,
    storm: 20, accident: 18, trapped: 22, medical: 15, missing: 10, other: 5
};
const FLAG_W = {
    multiple_victims: 15, children_involved: 20, elderly_involved: 10,
    rapid_spread: 12, infrastructure_damage: 10, no_communication: 8
};

const calculate = ({ distressScore, emergencyType, victimCount, urgencyFlags = [], hasLocation }) => {
    let score = distressScore * 30;
    score += TYPE_W[emergencyType] || 5;
    if (victimCount > 0) score += Math.min(victimCount * 2, 20);

    const flags = [...urgencyFlags];
    if (victimCount >= 5 && !flags.includes("multiple_victims")) flags.push("multiple_victims");
    flags.forEach(f => { score += FLAG_W[f] || 0; });
    if (hasLocation) score += 5;

    score = Math.min(Math.round(score), 100);
    const level = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";
    return { score, level, flags: [...new Set(flags)] };
};

module.exports = { calculate };