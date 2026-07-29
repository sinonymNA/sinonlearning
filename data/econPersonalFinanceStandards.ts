import type { StandardItem } from "@/lib/standardSort";

// The 75 lettered AKS standards from GCPS's 2025-2026 Economics & Personal
// Finance Pacing Guide, extracted programmatically from the source .docx.
//
// Only the lettered sub-items are here (17a, 17b, ...), never the numbered
// header line above them (e.g. "SSEC.17: analyze how scarcity affects the
// choices..."). The header describes the whole standard; the lettered items
// are the atomic, teachable units a curriculum team actually sorts one at a
// time.
//
// Map & globe skills (SSEC.A.1-4) and information processing skills
// (SSEC.B.5-16) are deliberately excluded — the pacing guide marks both
// "on-going: embed throughout the course," so they don't belong to any single
// unit and don't make sense in a unit-sort exercise.
//
// Text is verbatim from the pacing guide, including at least one source typo
// (SSEC.24c: "mortgag,e") — not corrected here, since silently editing an
// official curriculum document isn't this tool's place. Flag it upstream if
// it should change.
export const ECON_PF_STANDARDS: StandardItem[] = [
  { id: "0", code: "SSEC.17a", text: "explain that scarcity is a basic, permanent condition that exists because unlimited wants exceed limited productive resources by identifying and writing about issues and/or problems and alternative solutions" },
  { id: "1", code: "SSEC.17b", text: "compare and contrast strategies for allocating scarce resources such as by price, majority rule, contests, force, sharing, lottery, authority, first-come-first-served, and personal characteristics by constructing charts and tables" },
  { id: "2", code: "SSEC.17c", text: "define and give examples of productive resources (i.e. factors of production): natural resources (i.e. land), human resources (i.e. labor and human capital), physical capital and entrepreneurship by constructing charts and tables" },
  { id: "3", code: "SSEC.17d", text: "apply the concept of opportunity cost (the forgone next best alternative) to personal choices, as well as business and government decisions" },
  { id: "4", code: "SSEC.18a", text: "explain that rational decisions occur when the marginal benefits of an action equal or exceed the marginal costs by analyzing charts and/or tables that exemplify using cost-benefit analysis and a decision-making model" },
  { id: "5", code: "SSEC.18b", text: "explain that individuals, businesses, and governments respond to positive and negative incentives in predictable ways" },
  { id: "6", code: "SSEC.19a", text: "analyze how command, market, and mixed economic systems answer the three basic economic questions (what to produce, how to produce, and for whom to produce) by constructing charts and tables" },
  { id: "7", code: "SSEC.19b", text: "evaluate how the three basic economic systems prioritize various social and economic goals, such as freedom, security, equity, growth, efficiency, price stability, full employment, and sustainability" },
  { id: "8", code: "SSEC.19c", text: "compare the similarities and differences of the roles of government in different economic systems with regard to providing public goods and services, redistributing income, protecting property rights, resolving market failures, regulation, and providing consumer protections" },
  { id: "9", code: "SSEC.20a", text: "explain how investments in human capital (e.g., education, job training, and healthcare) can lead to a higher standard of living" },
  { id: "10", code: "SSEC.20b", text: "explain how investment in equipment and technology can lead to economic growth" },
  { id: "11", code: "SSEC.20c", text: "explain how individuals, businesses, and governments benefit from specialization and voluntary, non-fraudulent trade" },
  { id: "12", code: "SSEC.20d", text: "analyze graphs and diagrams to Illustrate economic growth using a production possibilities curve" },
  { id: "13", code: "SSEC.32a", text: "define the law of demand and law of supply, illustrate on a graph how price affects quantity demanded and quantity supplied" },
  { id: "14", code: "SSEC.32b", text: "describe various determinants (shifters) of supply (Technology, Resources, Number of Sellers, Government Actions (subsidies, regulations, and business taxes), and illustrate on a graph how they can change equilibrium price and quantity" },
  { id: "15", code: "SSEC.32c", text: "describe various determinants (shifters) of demand (Income, Number of Consumers, Substitute Goods, Future Price Expectations, Complementary Goods, Taste, and preferences) and illustrate on a graph how they can change equilibrium price and quantity" },
  { id: "16", code: "SSEC.32d", text: "explain and illustrate on a graph how prices set too high (e.g., price floors) create surpluses, and prices set too low (e.g., price ceilings) create shortages" },
  { id: "17", code: "SSEC.33a", text: "compare and contrast three forms of business organization—sole proprietorship, partnership, and corporation with regards to number of owners, liability, lifespan, decision-making, and taxation by constructing charts and tables" },
  { id: "18", code: "SSEC.33b", text: "compare and contrast the basic characteristics of monopoly, oligopoly, monopolistic competition, and pure (perfect) competition with regards to number of sellers, barriers to entry, price control, and product differentiation by constructing charts and tables" },
  { id: "19", code: "SSEC.31a", text: "explain, using a circular flow diagram, the real flow of goods and services, resources, and money through the product market and the resource (factor) market by analyzing graphs and diagrams" },
  { id: "20", code: "SSEC.34a", text: "describe key economic outcomes and how they are measured including economic growth using total spending as Gross Domestic Product (GDP) and real GDP; price stability using the Consumer Price Index (CPI); and full employment using the unemployment rate" },
  { id: "21", code: "SSEC.34b", text: "explain the differences between seasonal, structural, cyclical, and frictional unemployment" },
  { id: "22", code: "SSEC.34c", text: "describe the stages of the business cycle and its relation to economic measurement, including: peak, contraction, trough, recovery/expansion as well as recession by analyzing graphs and diagrams" },
  { id: "23", code: "SSEC.35a", text: "describe the organization of the Federal Reserve System (12 Districts, Federal Open Market Committee (FOMC), and Board of Governors)" },
  { id: "24", code: "SSEC.35b", text: "describe the Federal Reserve Bank’s roles in payment processing, bank supervision, and monetary policy including the dual mandate of price stability and full employment" },
  { id: "25", code: "SSEC.35c", text: "describe how the Federal Reserve uses various tools of monetary policy to target the federal funds rate and how this rate influences other interest rates in the economy by drawing conclusions and making generalizations based on information" },
  { id: "26", code: "SSEC.36a", text: "explain the effect on the economy of the government’s taxing and spending decisions in promoting price stability, full employment, and economic growth by drawing conclusions and make generalizations based on information" },
  { id: "27", code: "SSEC.36b", text: "explain how government budget deficits or surpluses impact national debt" },
  { id: "28", code: "SSEC.37a", text: "explain how nations benefit when they specialize in producing goods and services in which they have a comparative advantage by comparing data sets, charts, tables, and/or graphs to draw conclusions and make generalizations" },
  { id: "29", code: "SSEC.37b", text: "explain how trade barriers create costs and benefits to consumers and producers over time by comparing data sets, charts, tables, and/or graphs to draw conclusions and make generalizations" },
  { id: "30", code: "SSEC.37c", text: "analyze Georgia’s role in the international economy (i.e., the ports of Savannah and Brunswick, the Northeast inland port, the presence of multinational corporations in the state, and the impact of trade on the state’s economy) by analyzing maps, data sets, charts, tables, and/or graphs to draw conclusions and make generalizations" },
  { id: "31", code: "SSEC.38a", text: "describe factors that cause changes in exchange rates" },
  { id: "32", code: "SSEC.38b", text: "explain how appreciation and depreciation of currency affects net exports and benefits some groups and hurts others by comparing data sets, charts, tables, and/or graphs to draw conclusions and make generalizations" },
  { id: "33", code: "SSEC.21a", text: "apply a rational decision-making model to evaluate the costs and benefits of post-high school life choices (i.e., college, technical school, military enlistment, workforce participation, or other option) by constructing charts/tables showing the similarities and differences" },
  { id: "34", code: "SSEC.21b", text: "evaluate costs and benefits of various ways to pay for post-high school life, including scholarships, the HOPE scholarship, employment, work-study programs, loans, grants, savings, prior investments, and other options, by using primary and secondary sources" },
  { id: "35", code: "SSEC.21c", text: "identify necessary documents needed to complete forms like the FAFSA or scholarship applications by using primary and secondary sources" },
  { id: "36", code: "SSEC.21d", text: "apply a rational decision-making model to evaluate other major life choices, like employment opportunities, renting a home vs. buying, selecting a mortgage, and buying a car, by constructing charts/tables showing similarities and differences" },
  { id: "37", code: "SSEC.21e", text: "describe how individual financial decisions can help create generational wealth by analyzing charts/tables and primary/secondary sources" },
  { id: "38", code: "SSEC.28a", text: "identify skills that are required to be successful in the workplace, including positive work ethic, punctuality, time management, teamwork, and communication skills" },
  { id: "39", code: "SSEC.28b", text: "describe the impact a person’s social media footprint can have on their career and finances" },
  { id: "40", code: "SSEC.28c", text: "evaluate job and career options and explain the significance of investment in education, training, and skill development as it relates to future earnings by using primary and secondary sources" },
  { id: "41", code: "SSEC.25a", text: "describe income, sales, property, capital gains, and estate taxes in the U.S." },
  { id: "42", code: "SSEC.25b", text: "describe the difference between progressive, regressive, and proportional taxes" },
  { id: "43", code: "SSEC.22a", text: "compare different types of income, including hourly wages, salary, tips, independent contractor services (Form 1099), dividends, and capital gains" },
  { id: "44", code: "SSEC.22b", text: "review and complete a sample federal individual income tax form 1040 by using primary and secondary sources" },
  { id: "45", code: "SSEC.22c", text: "describe the basic components of a paystub including gross pay, net pay, and common deductions (i.e., federal and state income tax, Federal Insurance Contributions Act (FICA which includes Social Security and Medicare), and elective deductions like 401K, insurance, and tax-deferred savings) by analyzing primary and secondary sources" },
  { id: "46", code: "SSEC.22d", text: "analyze the basic components of a personal budget, including income, expenses (fixed and variable), and the importance of short-term and long-term savings by using primary and secondary sources" },
  { id: "47", code: "SSEC.22e", text: "explain how to reconcile a checking account, either online or on paper, including how to account for transactions that have not been posted (i.e., checks, weekend debit card transactions, or monthly auto-pay transactions), and how this helps avoid overdraft fees by analyzing primary and secondary sources" },
  { id: "48", code: "SSEC.22f", text: "describe how to determine a person’s net worth" },
  { id: "49", code: "SSEC.23a", text: "explain the roles/functions of money as a medium of exchange, store of value, and Formative of account/standard of value" },
  { id: "50", code: "SSEC.23b", text: "compare and contrast services offered by different financial institutions, including banks, credit unions, payday lenders, and title pawn lenders in a chart and/or table" },
  { id: "51", code: "SSEC.23c", text: "compare and contrast cash, debit cards, credit cards, prepaid cards, and mobile payment apps in terms of how they work, acceptability, and the costs and benefits associated with each in a chart and/or table" },
  { id: "52", code: "SSEC.23d", text: "evaluate the risk and return of a variety of savings and investment options, including: savings accounts, certificates of deposit, retirement accounts (i.e., Roth IRA, 401K, 403b), stocks, bonds, 529 accounts, and mutual funds, and explain the importance of diversification when investing in a chart and/or table" },
  { id: "53", code: "SSEC.23e", text: "describe the role of speculative investments (i.e., cryptocurrency and historical examples like buying on margin in the 1920's)" },
  { id: "54", code: "SSEC.24a", text: "compare and contrast interest rates on loans and credit cards from different institutions, including banks, credit unions, payday loan facilities, and title-pawn companies, in a chart and/or table" },
  { id: "55", code: "SSEC.24b", text: "define annual percentage rate and describe how different interest rates can affect monthly payments on loans" },
  { id: "56", code: "SSEC.24c", text: "use an online amortization tool to show how payments on a fixed loan, like a mortgag,e are applied to interest and principal by using a primary source" },
  { id: "57", code: "SSEC.24d", text: "explain the difference between simple and compound interest and the difference between fixed and variable interest" },
  { id: "58", code: "SSEC.24e", text: "define nominal and real returns and explain how inflation affects interest-earning savings and investment accounts" },
  { id: "59", code: "SSEC.26a", text: "explain the difference between how to access one's credit report and access one's credit score through a chart and/or table and primary/secondary sources" },
  { id: "60", code: "SSEC.26b", text: "describe the basic components of a credit score, including payment history, debt-to-income ratio, amount owed, length of credit history, types of credit used, amount of available credit, and recent credit applications through a chart and/or table" },
  { id: "61", code: "SSEC.26c", text: "analyze and evaluate a sample loan application for creditworthiness and the ability to receive favorable interest rates by using primary and secondary sources" },
  { id: "62", code: "SSEC.26d", text: "explain the difference between revolving credit and installment credit" },
  { id: "63", code: "SSEC.26e", text: "explain causes of personal bankruptcy and describe consequences of declaring bankruptcy" },
  { id: "64", code: "SSEC.27a", text: "explain why people buy insurance" },
  { id: "65", code: "SSEC.27b", text: "describe various types of insurance, such as automobile, health, life (whole and term), disability, renters, flood, and property, in a chart showing similarities and differences" },
  { id: "66", code: "SSEC.27c", text: "explain the costs and benefits associated with different types of insurance, including deductibles, premiums, coverage limits, shared liability, and asset protection in a chart showing similarities and differences" },
  { id: "67", code: "SSEC.27d", text: "define insurability and explain why insurance rates can vary" },
  { id: "68", code: "SSEC.29a", text: "describe how government agencies offer protection in banking, investments, borrowing, and buying goods and services" },
  { id: "69", code: "SSEC.29b", text: "compare and contrast different methods for lodging consumer complaints (e.g., Better Business Bureau, online methods, and direct contact with business) through charts and/or tables" },
  { id: "70", code: "SSEC.29c", text: "explain the primary purpose of important consumer legislation (i.e., the Truth in Lending Act, Fair Debt Collection Practices Act, Fair Credit Reporting Act, the Equal Housing Act, and the Dodd-Frank Act) by using primary and secondary sources" },
  { id: "71", code: "SSEC.30a", text: "describe common ways identity theft happens, including dumpster diving, skimming, phishing, stealing, and data breaches" },
  { id: "72", code: "SSEC.30b", text: "describe ways to protect yourself from identity theft, including shredding important documents, not opening attachments to unknown emails, not revealing personal information over the phone or email, using secure networks, regularly monitoring your credit report, changing passwords on accounts, and carefully managing social media" },
  { id: "73", code: "SSEC.30c", text: "describe steps that should be taken if a person is the victim of identity theft, including getting replacement credit cards, freezing credit histories, alerting appropriate officials, and changing passwords" },
  { id: "74", code: "SSEC.30d", text: "describe the basic characteristics of investment scams such as Ponzi schemes, pump and dumps, and “advance fee” scams, and how to avoid them" },
];
