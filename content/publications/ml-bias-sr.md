---
title: "Towards a standardised approach to bias detection in clinical ML: A scoping review"
authors:
  - "Rudolf J Schnetler"
  - "Benjamin J Crowley"
  - "Joshua K Keogh"
  - "Peter Douglas"
  - "Bevan Koopman"
  - "Andrew J Mallett"
  - "Emma S McBryde"
  - "Ian A Scott"
  - "Clair Sullivan"
  - "Stephen Whebell"
  - "Guido Zuccon"
  - "Anton H van der Vegt"
year: 2026
month: "June"
journal: "MetaArXiv"
doi: "10.31222/osf.io/xn2wp_v1"
publication_type: "preprint"
abstract: "<p><strong>Objective:</strong> To map quantitative methods for detecting bias in clinical machine learning (ML) models trained on structured clinical data.</p><p><strong>Materials and Methods:</strong> Following the PRISMA-ScR guidelines, we searched MEDLINE, IEEE Xplore, ACM Digital Library, and Scopus for articles published from 2016 to 21 January 2026, using terms related to bias, fairness, ML, and healthcare contexts. To focus on structured clinical data, we excluded medical imaging, robotics, and natural language processing. We extracted data to characterise bias types, statistical detection methods, and subgroup attributes across the model lifecycle.</p><p><strong>Results:</strong> Fifty-four included studies identified 221 bias detection instances, revealing substantial heterogeneity: 81 author-reported methods using 65 distinct mathematical formulae. Statistical rigour was variable; 45.8% of instances reported confidence intervals and 37.1% reported significance testing, with 37.6% reporting neither. Analyses predominantly focused on race/ethnicity, sex, and age. Most studies restricted bias detection to model evaluation (n = 21, 38.9%), with limited application at earlier stages.</p><p><strong>Discussion:</strong> Substantial methodological variation exists in how bias detection methods are defined and applied. The absence of statistical rigour and standardised approaches creates reliability concerns for clinical applications. Concentrating detection methods at evaluation limits understanding of the origins of bias and constrains mitigation efforts to post-hoc reactive rather than designed-in preventive approaches. Recommendations address metric definitions, threshold reporting, validation justification, uncertainty estimates, attribute/subgroup selection, and clinical implementation.</p><p><strong>Conclusions:</strong> A lack of standardised methodology prevents reliable bias evaluation, hindering safe clinical ML deployment. Consensus-based standards are needed, focusing on clear taxonomies, context-appropriate metrics, and robust statistical validation.</p>"
keywords: ["machine learning", "bias", "bias detection methods", "electronic medical records"]
draft: false
---

A PRISMA-ScR scoping review mapping how quantitative bias-detection methods are defined and applied in machine learning models trained on structured clinical data. Across 54 studies we catalogued 221 bias-detection instances and found substantial methodological heterogeneity — 81 author-reported methods built on 65 distinct mathematical formulae — with inconsistent statistical rigour and detection concentrated almost entirely at the model-evaluation stage. We argue that the absence of standardised methodology undermines reliable bias evaluation for clinical ML, and we set out recommendations spanning metric definitions, threshold and uncertainty reporting, subgroup selection, and clinical implementation.
