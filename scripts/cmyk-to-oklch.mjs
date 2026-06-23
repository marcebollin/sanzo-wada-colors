/**
 * CMYK (Japanese print format) -> OKLCH converter.
 *
 * Sanzo Wada's "A Dictionary of Color Combinations" records each color as CMYK
 * percentages (0-100 per channel), but CMYK by itself is under-specified for a
 * screen conversion because it has no ICC profile, paper, ink, or press state.
 *
 * This converter keeps the local color.cmyk values as the inputs, then applies
 * a calibrated OKLab polynomial fitted from the 159 visible W.S. Colors swatches.
 * The calibration is intentionally scoped to this dictionary collection; it is
 * not a generic printer profile for arbitrary CMYK artwork.
 *
 * Usage:
 *   node scripts/cmyk-to-oklch.mjs          # fill in only missing oklch values
 *   node scripts/cmyk-to-oklch.mjs --force  # recompute every oklch value
 *   node scripts/cmyk-to-oklch.mjs --dry    # print results, do not write file
 *   node scripts/cmyk-to-oklch.mjs --audit  # report stored-vs-derived drift
 */

import { readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  clampChroma,
  converter,
  differenceCiede2000,
  formatCss,
  formatHex,
} from "culori"

const __dirname = dirname(fileURLToPath(import.meta.url))
const COLORS_PATH = resolve(__dirname, "../src/data/colors.json")

const CHANNELS = ["c", "m", "y", "k"]
const POLYNOMIAL_DEGREE = 6
const FEATURE_COUNT = 210

const OKLAB_COEFFICIENTS = Object.freeze({
  l: Object.freeze([
    0.999999950858227, 1.76180063660377, -1.02083642164785, -0.993438641262148,
    -30.1201212329206, -13.0869366878689, 2.86742434271814, -5.98980370990394,
    6.03356734126653, -3.42562626729475, 9.5300822361649, 32.6599603925789,
    8.8181294652619, 153.879653626132, -56.8766672289831, 10.6681371398422,
    41.9387037971731, 105.108874653972, 248.821942962056, -46.3978638922322,
    -6.91293585049388, -205.54534596037, -57.9165951670764, -44.9814073611202,
    -26.0810496850573, 34.9357010127481, -50.2523636016856, 134.882634742347,
    -1.40691579383561, -265.749061665677, 264.176483839916, -37.9994955272753,
    -186.624299956602, -112.68901111474, 259.036496914274, 10.4946662988829,
    -37.4969845807812, -232.453158772682, -224.569891599512, 18.7625888645389,
    -300.893354011864, -104.950015444823, -55.3188396797939, -30.8541340878778,
    92.8397161837209, 12.1318375326963, 321.296030607381, -1.84472811376961,
    -85.7762751057317, 236.619924220129, 174.339334876543, 249.19451479438,
    -71.6002177665697, -198.977771740034, 69.319727301046, -51.0958994833333,
    -23.7378760727188, -264.31148493615, 157.538129494614, 28.5744068836758,
    -257.51241647939, -67.2121152742151, 312.434951818875, -191.469561455947,
    -149.370162932851, 78.7482643181355, 17.6684108187806, 69.128913549527,
    256.91060525523, -235.501969965411, 30.8080047186587, -114.737041069315,
    111.831000068572, -101.363434523173, 50.4416037549048, 547.360895344337,
    368.822260330876, 162.027451652274, -274.877171591844, 201.052629844209,
    -1.18378359479315, -160.586621189471, -168.104524610663, 350.024126639552,
    -16.1513878590717, -205.264633189747, -87.5598691343754, -83.7032849464182,
    -124.564309606649, -161.044207505529, 20.6150000967337, -178.995453700226,
    170.721086383196, -389.612085145862, 331.154232833301, -209.741960069532,
    163.075702112037, 3.74614485251889, 259.662545244178, -89.9994080342704,
    -331.233865724525, 245.605019507727, 8.2031718409268, -108.402547157841,
    -122.576749523175, 27.4403322770848, 36.5607941784936, 209.485376628959,
    9.50392420663882, -72.9511504033389, 343.426983249831, -191.345432227657,
    96.0064397224415, -27.7711190321884, -470.566585933542, 117.788028551698,
    -38.8205748577378, -439.096610058376, 363.623465133752, -239.344003150559,
    -75.8821196772653, 81.9747247850035, 80.5069603909447, -136.305896304865,
    298.451290569228, -165.494669137611, -28.1414359474793, 60.8049266112033,
    -15.1906408401532, 33.5083900286688, 12.9620166953411, -184.626810486372,
    181.078131140361, -47.2972487648568, 379.093524076753, -15.1003839562544,
    0.219208750145763, -92.5389623099798, -373.417282276519, -218.502767198009,
    -118.81123882507, -349.160623928544, -13.4447674917279, -166.830175582566,
    189.365984719797, -401.758312790835, -28.3658987644236, 85.9789802275941,
    241.264430832792, 106.848112760413, -238.433554235922, 402.007184086762,
    -137.271697783913, 99.4105346005602, 369.27763682531, 347.069788637317,
    63.9316565679577, 152.359958426307, 168.638255132815, -157.56795981861,
    328.480358149171, -10.2875353187891, 51.878168383339, -120.831217647094,
    55.5414234744149, 104.120729770097, -68.5679788965731, 176.77809031422,
    -512.164863379057, -150.616689233992, -8.17367746963547, -87.5021031603768,
    -10.5691679599048, -97.2236556709649, 166.934134258449, 2.70994772692068,
    146.199528926486, -197.298199587483, 333.448328603973, -385.216960376658,
    -240.436289812384, 251.933348219287, -1.23105662491545, -25.7154362298321,
    -62.955161301279, 14.5756301727185, -30.9463716985844, 77.6423888687327,
    -21.6819936498438, 67.7037140955047, -343.83541601644, -173.377823946069,
    88.0173119076274, -83.8211854852429, 569.328291621739, 48.0940871482212,
    370.192355543084, -58.1467441352013, -56.3887183738429, -38.720271712193,
    281.753177767028, 491.96604967434, -206.94987514146, 27.2498436198783,
    -45.4757532987063, 162.354715822732, -674.874286466412, 159.348930464893,
    -122.27273756132, 155.84433963715,
  ]),
  a: Object.freeze([
    -3.58281928401416e-8, -0.457738380671804, -1.40809367066698,
    0.833471429265731, -25.6881482065089, 2.11687183689553, 11.3548273609686,
    -0.660834769098376, 28.807733762908, 4.92722602906003, 5.19525389146466,
    32.9059601826819, -2.57921412254279, 113.600675002121, -41.955719932752,
    -16.5924916667154, -13.7673672794961, 35.2940033000084, 138.771700715795,
    -50.6785596586914, -12.5961001362529, -152.677899570692, -30.085619769764,
    -58.5584373742836, -59.9012973472441, 10.6479732524217, -60.4685246706396,
    114.753486623409, 35.3129728641571, -248.402760883992, 259.639947948901,
    -13.2460165237466, -102.888981936802, -85.5508816565091, 126.011652926139,
    33.0304258708204, 51.1697266868851, -113.019617537755, -150.489665198151,
    55.8612841487287, -125.96884232187, -42.1737845133779, 24.0726610310424,
    -42.5187776452783, 121.942016195446, 20.1645265572108, 256.055182042189,
    13.4212507353149, -124.016487122038, 146.117412347651, 2.08383860558866,
    137.774509140636, -48.1584500018854, -108.979479245964, 60.5136560808073,
    -22.786158260629, 20.5692274493373, -261.360039632676, 136.912971616667,
    82.6779153620473, -206.217820277458, -148.839146261535, 235.877583579387,
    -70.947985840672, -67.2520574529311, 61.9989367219778, -25.402417541067,
    85.5180202779846, 134.691248006038, -115.261121392146, 10.7164916183094,
    -126.188927372411, 36.1661157289041, -129.281056626522, -48.5751106764364,
    281.538798188677, 325.271832025787, 97.3797562417033, -97.0839285399005,
    280.751765806001, 11.0261308551801, -175.557605431145, -72.2626022300584,
    213.498594439479, -88.6808855423365, -207.269711976984, -146.863979583825,
    -19.6196384509091, -169.294312916256, -127.569246194516, 8.02477786258571,
    -144.630122592865, 76.2570616461916, -258.104262486593, 254.574844846647,
    -142.074748482175, 221.758621573641, 48.6166954615568, 179.086377393334,
    -68.4498932326174, -185.595336251957, 224.721278975703, 45.1737732545045,
    -18.799667718186, -42.6877906665149, 15.3987061717591, -0.496442852503812,
    199.343926944804, -25.0008739060017, -19.2934967032463, 145.81011225899,
    -136.626344150598, 40.3878709540842, -10.74660626989, -322.815267209035,
    190.29697002024, -67.6436061986614, -411.330574794844, 268.715154844316,
    -173.322135628548, -82.2186411953997, 54.7612041047204, 64.2163691569561,
    -99.2554352531812, 181.692124742473, -77.4820960454754, -17.5354655566676,
    41.4998662657076, 0.72911680749058, 91.4783307220439, 47.6658945142176,
    -87.6544315316697, 85.3354140950436, -29.1312351362086, 177.947144072574,
    -91.9196090344771, 22.8936080363073, -35.5272884967004, -375.778524544896,
    -119.695410974621, -68.2976701889746, -59.6333079044414, -0.927672889689954,
    -82.0315240154778, 103.220425158582, -420.138747350073, -43.9807579728216,
    82.0449489730121, 218.734288515746, 63.3952860283054, -121.057283363057,
    105.343795638311, -85.9931185303339, 92.0405559900563, 222.964699121664,
    307.605075626646, 82.9189706992874, 38.9710674188041, 67.1022585316295,
    -13.2492073433127, 184.329567617009, -2.37805447861829, 46.5074578782956,
    -90.8622755837853, 25.7561882861677, 49.2062260292896, 130.160038790611,
    117.339253906217, -410.748205755521, -57.4030342664157, -12.1737072877197,
    -116.300397026223, 38.8027849966429, -106.596895901689, 60.9139417302292,
    22.598503715375, 83.3512478152835, -182.945146467169, 229.487965100008,
    -243.878119825233, -97.7710450288557, 176.087972413087, -2.31402980714733,
    -9.80066098771911, -40.1957411295004, 17.9045019389539, -53.7439056772614,
    46.7974094205767, -3.65626091748483, 53.2342594664389, -215.358166207907,
    -95.3900468143859, 54.625087008076, -69.5588654250977, 459.402209120857,
    34.2953508532514, 250.073646269706, -80.2277320502399, 12.7992235147893,
    -100.537521295626, 258.156297082076, 270.601639214145, -173.26066207119,
    35.1572791358497, -20.3262930309038, 103.209739896865, -406.950101350634,
    18.0482119898276, -72.0663922038034, 77.6365692606531,
  ]),
  b: Object.freeze([
    -1.8233942437029e-8, 0.608747945930718, -0.412301031781044,
    0.165127939455184, -10.9874987638262, -4.18989887573133, 1.97785853768707,
    -4.18693896149474, 3.51315474776729, -0.427824574821095, 3.37927562762292,
    12.2882704134363, 1.46263275260205, 57.0858024596701, -28.4066481433954,
    1.30562896728528, 10.4060768912681, 44.3503625780713, 88.2998413420245,
    -19.4551128840208, 1.46773743307912, -75.592303674065, -13.7783969548533,
    -10.0009766354354, -15.0307492544944, 11.9314787530858, -22.5020179916547,
    65.3428029915446, 3.26600928764436, -116.373786227094, 120.217039611365,
    -9.58906131651095, -69.7061329758858, -31.0998786962639, 92.5212080284493,
    7.60639167911079, -2.46235758170676, -91.2726532122557, -89.97062454226,
    13.5862524582038, -113.597176048805, -33.8782845493771, -37.1193963840402,
    -4.2223313487773, 33.4760141240035, 5.74610395981424, 120.7237453481,
    6.34610112473948, -54.5229432446886, 83.8396082772156, 33.2226200767081,
    84.342289582145, -37.3761426661627, -74.9219252228587, 26.022457486618,
    -19.6271272787356, -1.96031611871742, -134.678537811208, 62.420311185243,
    20.4415571957772, -107.74068040925, -35.373796841033, 123.728834707835,
    -48.7647053736416, -53.1849605601993, 24.0373292865546, 15.3357278328175,
    21.9621695803553, 101.063506092166, -79.3843524119094, 10.1485118315353,
    -47.4491749331198, 40.2647401085713, -51.8113193765241, -7.35011592554362,
    205.531774718469, 158.946852500985, 77.4051322205149, -86.2214694052738,
    101.786082254141, 15.5527298080543, -81.0019736004175, -40.4272855381466,
    151.957991974784, -26.1319097872797, -67.828010112043, -26.5928480807037,
    -23.1478670953201, -76.1496502698018, -53.8986962326445, 0.661063351169228,
    -58.5625729010941, 38.5663029198008, -138.876933787237, 120.618795337645,
    -67.3878021936581, 84.6907421644847, -1.0065862668768, 90.490888869856,
    -22.5858458652463, -118.777728526173, 93.9097450469879, 25.1423184335154,
    -51.35835445497, -46.23784799065, 13.4183909981556, 5.96730991998693,
    110.234426243945, 0.716289641003052, -24.4735561586099, 108.041546103462,
    -73.5231047805035, 51.3728792238419, -23.4486773549289, -186.574821520709,
    55.0637242602872, -28.6395313986709, -176.70897065496, 118.487424298992,
    -77.8091252238562, -25.7881801705805, 25.032896977665, 4.00598846776711,
    -41.7135592818241, 103.45173039796, -57.0981120314461, -9.58740861699011,
    18.7632723953751, -8.00519281076128, 32.7552132359841, 15.9959737384078,
    -64.2289430473757, 61.8154981800248, -15.5274292110627, 116.840940139463,
    -21.7913515881375, 9.06628355186057, -22.1567514230141, -188.250997271489,
    -97.301844787298, -42.3835522673221, -93.9838490231706, -15.1876095421211,
    -44.256405410925, 75.6784333335187, -177.38877059168, -26.0994865237118,
    32.7725878052268, 116.079792785051, 47.9363784652273, -110.568753873138,
    111.490510043004, -59.1220759872764, 54.9645289453077, 138.785546122009,
    156.08458555976, 27.6045098702119, 33.6586075405407, 56.0039218686953,
    -38.6880737561833, 115.960126516859, 2.9830920248285, 17.36718217885,
    -47.9897847585677, 12.2008843900968, 66.0121155462205, 4.92473900768035,
    63.7536918174356, -213.878201160644, -24.0618742193205, -40.684451612155,
    -40.6726701561937, 10.1066273574999, -40.6912021898733, 47.8557876670757,
    -0.126202987388639, 52.73031389754, -77.5106454266757, 143.720283626444,
    -162.860493537705, -62.9244262946828, 81.0739748612169, -2.67743382469172,
    -6.99257164608298, -29.3208811778725, 8.02981200662972, -20.204330586559,
    30.5001862382445, -8.45732956581872, 15.5748386903548, -109.236275735742,
    -52.8481773635413, 33.6412690501092, -27.1135304704255, 207.875940254751,
    21.067897349368, 142.693826828408, -25.9909394795163, -18.3520736673314,
    -12.564330602689, 98.9931995091354, 186.078677770426, -77.7923700516299,
    9.9050635711681, -15.7305168440739, 76.0287094141387, -246.735491424986,
    38.0309096242792, -28.8229837736633, 53.2290426897738,
  ]),
})

const CALIBRATED_CMYK_KEYS = new Set([
  "0,30,6,0",
  "0,35,15,0",
  "10,32,19,0",
  "18,31,30,0",
  "8,30,20,25",
  "0,55,40,0",
  "0,53,45,0",
  "0,62,58,0",
  "0,63,23,0",
  "0,70,21,0",
  "15,70,40,0",
  "7,76,60,0",
  "0,80,50,10",
  "18,58,100,12",
  "17,72,100,6",
  "2,83,100,0",
  "5,100,100,0",
  "9,90,100,0",
  "16,80,74,6",
  "22,76,100,15",
  "18,73,63,20",
  "10,95,72,7",
  "0,100,75,16",
  "12,89,35,9",
  "30,90,33,0",
  "23,100,50,6",
  "38,90,70,0",
  "22,84,100,18",
  "25,95,80,16",
  "18,97,74,19",
  "30,100,90,10",
  "35,74,90,35",
  "37,85,87,35",
  "32,95,95,33",
  "34,100,60,34",
  "25,90,80,40",
  "75,100,50,5",
  "40,71,55,40",
  "4,4,28,0",
  "0,4,38,0",
  "2,7,44,0",
  "8,15,40,0",
  "0,19,23,0",
  "0,25,40,0",
  "0,32,53,0",
  "0,23,57,0",
  "0,28,68,0",
  "2,42,74,0",
  "4,40,42,0",
  "15,38,55,0",
  "15,28,60,10",
  "5,26,56,20",
  "16,6,42,12",
  "20,25,40,6",
  "0,0,100,0",
  "5,0,85,0",
  "0,10,100,0",
  "23,25,80,0",
  "18,26,90,0",
  "12,28,88,0",
  "0,33,100,0",
  "0,45,100,0",
  "0,55,75,0",
  "0,68,100,0",
  "0,80,90,0",
  "13,73,100,0",
  "20,60,82,5",
  "18,65,100,8",
  "24,32,100,4",
  "24,45,100,6",
  "35,17,95,0",
  "36,32,100,7",
  "42,40,82,8",
  "38,34,67,20",
  "43,36,62,19",
  "48,35,70,12",
  "18,38,100,15",
  "28,48,92,24",
  "25,60,65,19",
  "56,40,85,22",
  "42,46,73,24",
  "50,48,78,37",
  "46,63,87,32",
  "48,60,100,40",
  "36,88,100,38",
  "39,76,100,47",
  "56,71,97,52",
  "29,0,24,0",
  "30,9,24,0",
  "30,15,36,0",
  "35,0,72,0",
  "26,5,85,0",
  "52,0,100,0",
  "40,30,80,0",
  "57,28,39,8",
  "60,40,50,10",
  "42,20,62,28",
  "50,16,58,20",
  "64,29,56,6",
  "80,0,51,0",
  "100,15,55,0",
  "86,22,50,3",
  "75,21,73,0",
  "90,20,80,0",
  "53,28,100,8",
  "87,20,100,10",
  "76,32,91,18",
  "60,48,86,37",
  "56,32,63,55",
  "76,60,80,62",
  "25,0,10,0",
  "33,4,7,0",
  "35,10,14,0",
  "41,25,10,0",
  "42,0,42,0",
  "50,0,20,0",
  "58,0,30,0",
  "84,26,32,0",
  "100,19,43,0",
  "82,24,40,3",
  "69,44,10,0",
  "95,54,0,0",
  "100,40,30,10",
  "100,62,19,10",
  "70,45,45,15",
  "100,30,64,50",
  "100,85,15,6",
  "85,79,38,16",
  "100,73,43,10",
  "90,66,36,50",
  "100,90,38,50",
  "100,92,52,60",
  "80,50,60,70",
  "28,28,0,0",
  "25,33,20,0",
  "20,48,18,0",
  "28,54,8,0",
  "25,79,12,0",
  "43,62,5,0",
  "39,68,5,0",
  "57,60,17,0",
  "70,68,13,0",
  "72,80,0,0",
  "38,65,49,26",
  "61,52,43,7",
  "42,78,46,15",
  "64,85,60,10",
  "30,70,35,40",
  "64,90,70,10",
  "85,90,18,0",
  "76,100,25,15",
  "66,100,42,40",
  "75,100,46,30",
  "0,0,0,0",
  "29,18,20,0",
  "33,18,25,7",
  "37,28,36,3",
  "85,70,62,30",
  "20,10,15,100",
])

export const PRINT_PROFILE = Object.freeze({
  name: "wscolors-calibrated-oklab-polynomial",
  source:
    "local color.cmyk values calibrated against https://wscolors.com/colors target hex values",
  calibration:
    "degree-6 ridge fit in OKLab from the 159 Wada Sanzo color cards",
  scope: "Sanzo Wada dictionary colors only; not a generic CMYK press profile",
  polynomialDegree: POLYNOMIAL_DEGREE,
  ridge: 1e-14,
  targetCount: 159,
  calibratedCmykCount: CALIBRATED_CMYK_KEYS.size,
  featureCount: FEATURE_COUNT,
  renderedOklchError: Object.freeze({
    meanOklabDeltaE: 0.0367,
    maxOklabDeltaE: 0.0652,
    maxCiede2000: 0.145,
  }),
  maxTotalInk: 350,
})

const toRgb = converter("rgb")
const toOklch = converter("oklch")
const deltaE = differenceCiede2000()

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg !== "--"))
  const known = new Set(["--force", "--dry", "--audit", "--help"])
  const unknown = [...flags].filter(
    (arg) => arg.startsWith("--") && !known.has(arg),
  )

  if (unknown.length > 0) {
    throw new Error(`Unknown option(s): ${unknown.join(", ")}`)
  }

  return {
    audit: flags.has("--audit"),
    dry: flags.has("--dry"),
    force: flags.has("--force"),
    help: flags.has("--help"),
  }
}

function printHelp() {
  console.log(`Usage: node scripts/cmyk-to-oklch.mjs [--force] [--dry] [--audit]

Options:
  --force  Recompute every OKLCH value, not only missing values.
  --dry    Print changes without writing src/data/colors.json.
  --audit  Print stored-vs-derived color drift and profile warnings.
  --help   Show this message.
`)
}

function assertCmyk(cmyk, label = "CMYK") {
  if (!cmyk || typeof cmyk !== "object") {
    throw new TypeError(
      `${label} must be an object with c, m, y, and k channels`,
    )
  }

  for (const channel of CHANNELS) {
    const value = cmyk[channel]
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new RangeError(
        `${label}.${channel} must be a finite number from 0 to 100`,
      )
    }
  }
}

function sumInk(cmyk) {
  return CHANNELS.reduce((total, channel) => total + cmyk[channel], 0)
}

function round(value, decimals = 3) {
  const rounded = Number(value.toFixed(decimals))
  return Object.is(rounded, -0) ? 0 : rounded
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

function clampRgb(rgb) {
  return {
    mode: "rgb",
    r: clamp01(rgb.r),
    g: clamp01(rgb.g),
    b: clamp01(rgb.b),
  }
}

function cmykKey(cmyk) {
  return CHANNELS.map((channel) => cmyk[channel]).join(",")
}

function isCalibratedCmyk(cmyk) {
  return CALIBRATED_CMYK_KEYS.has(cmykKey(cmyk))
}

function fallbackCmykToRgb(cmyk) {
  const c = cmyk.c / 100
  const m = cmyk.m / 100
  const y = cmyk.y / 100
  const k = cmyk.k / 100

  return {
    mode: "rgb",
    r: (1 - c) * (1 - k),
    g: (1 - m) * (1 - k),
    b: (1 - y) * (1 - k),
  }
}

function polynomialFeatures(cmyk, degree = POLYNOMIAL_DEGREE) {
  const values = CHANNELS.map((channel) => cmyk[channel] / 100)
  const features = [1]

  function visit(start, depth, product) {
    if (depth === 0) {
      features.push(product)
      return
    }

    for (let i = start; i < values.length; i++) {
      visit(i, depth - 1, product * values[i])
    }
  }

  for (let nextDegree = 1; nextDegree <= degree; nextDegree++) {
    visit(0, nextDegree, 1)
  }

  return features
}

function assertCalibrationShape() {
  const features = polynomialFeatures({ c: 0, m: 0, y: 0, k: 0 })

  if (features.length !== FEATURE_COUNT) {
    throw new Error(
      `Expected ${FEATURE_COUNT} polynomial features, received ${features.length}`,
    )
  }

  for (const [channel, coefficients] of Object.entries(OKLAB_COEFFICIENTS)) {
    if (coefficients.length !== FEATURE_COUNT) {
      throw new Error(
        `Expected ${FEATURE_COUNT} ${channel} coefficients, received ${coefficients.length}`,
      )
    }
  }
}

assertCalibrationShape()

function dot(coefficients, features) {
  return coefficients.reduce(
    (total, coefficient, index) => total + coefficient * features[index],
    0,
  )
}

function cmykToOklab(cmyk) {
  assertCmyk(cmyk)

  const features = polynomialFeatures(cmyk)

  return {
    mode: "oklab",
    l: dot(OKLAB_COEFFICIENTS.l, features),
    a: dot(OKLAB_COEFFICIENTS.a, features),
    b: dot(OKLAB_COEFFICIENTS.b, features),
  }
}

/**
 * Convert a single CMYK channel set (0-100 Japanese format) to an sRGB triplet
 * in the 0-1 range.
 */
export function cmykToRgb(cmyk) {
  return convertCmyk(cmyk).rgb
}

function convertCmyk(cmyk) {
  assertCmyk(cmyk)

  if (!isCalibratedCmyk(cmyk)) {
    const rgb = fallbackCmykToRgb(cmyk)
    const rawOklch = toOklch(rgb)
    const clampedOklch = clampChroma(rawOklch, "oklch", "rgb")

    return {
      rgb,
      rawRgb: rgb,
      rawOklab: undefined,
      rawOklch,
      clampedOklch,
      fallback: true,
    }
  }

  const rawOklab = cmykToOklab(cmyk)
  const rawRgb = toRgb(rawOklab)
  const rgb = clampRgb(rawRgb)
  const rawOklch = toOklch(rawOklab)
  const clampedOklch = clampChroma(rawOklch, "oklch", "rgb")

  return { rgb, rawRgb, rawOklab, rawOklch, clampedOklch, fallback: false }
}

/**
 * Round to a sensible number of decimals for OKLCH output:
 * L/C at 3dp, H up to 3dp, and no negative zero.
 */
function formatOklch(color) {
  const c = round(color.c)

  return formatCss({
    mode: "oklch",
    l: round(color.l),
    c,
    h: c === 0 ? 0 : round(color.h ?? 0),
  })
}

export function cmykToOklch(cmyk) {
  return formatOklch(convertCmyk(cmyk).clampedOklch)
}

function auditColor(color, derived) {
  const inkTotal = sumInk(color.cmyk)
  const current = color.oklch
  const drift = current ? deltaE(current, derived.css) : undefined
  const chromaClamp = Math.max(0, derived.rawOklch.c - derived.clampedOklch.c)
  const warnings = []

  if (!current) warnings.push("missing oklch")
  if (derived.fallback) warnings.push("used generic CMYK fallback")
  if (inkTotal > PRINT_PROFILE.maxTotalInk)
    warnings.push(`total ink ${inkTotal}%`)
  if (chromaClamp > 0.001)
    warnings.push(`clamped C by ${chromaClamp.toFixed(3)}`)
  if (drift !== undefined && drift > 0.1)
    warnings.push(`stored drift dE ${drift.toFixed(2)}`)

  return {
    id: color.id,
    name: color.name,
    inkTotal,
    rgb: formatHex(derived.rgb),
    current,
    derived: derived.css,
    drift,
    warnings,
  }
}

function printAudit(rows) {
  console.log(`\n[audit] Profile: ${PRINT_PROFILE.name}`)
  console.log(`[audit] Source: ${PRINT_PROFILE.source}`)
  console.log(`[audit] Calibration: ${PRINT_PROFILE.calibration}`)
  console.log(`[audit] Scope: ${PRINT_PROFILE.scope}`)

  for (const row of rows) {
    const drift = row.drift === undefined ? "n/a" : row.drift.toFixed(2)
    const warnings =
      row.warnings.length > 0 ? ` | ${row.warnings.join("; ")}` : ""
    console.log(
      `[audit] #${String(row.id).padStart(2, "0")} ${row.name}: ` +
        `ink ${row.inkTotal}% | ${row.rgb} | dE ${drift}${warnings}`,
    )
  }

  const warnings = rows.reduce((count, row) => count + row.warnings.length, 0)
  const maxDrift = rows.reduce((max, row) => Math.max(max, row.drift ?? 0), 0)
  console.log(
    `[audit] ${rows.length} color(s), ${warnings} warning(s), max stored drift dE ${maxDrift.toFixed(2)}.`,
  )
}

function stringifyColors(colors) {
  return `${JSON.stringify(colors, null, 2).replace(
    /"combinationIds": \[\n((?: {6}\d+,?\n)+) {4}\]/g,
    (_, body) => {
      const ids = [...body.matchAll(/\d+/g)].map(([id]) => id)
      const inline = `"combinationIds": [${ids.join(", ")}]`

      if (`    ${inline}`.length < 80) return inline

      const lines = []
      let line = "      "

      for (const [index, id] of ids.entries()) {
        const token = `${id}${index === ids.length - 1 ? "" : ","}`
        const nextLine =
          line === "      " ? `${line}${token}` : `${line} ${token}`

        if (nextLine.length > 80) {
          lines.push(line)
          line = `      ${token}`
        } else {
          line = nextLine
        }
      }

      lines.push(line)

      return `"combinationIds": [\n${lines.join("\n")}\n    ]`
    },
  )}\n`
}

async function main() {
  const { audit, dry, force, help } = parseArgs(process.argv.slice(2))

  if (help) {
    printHelp()
    return
  }

  const raw = await readFile(COLORS_PATH, "utf8")
  const colors = JSON.parse(raw)

  let changed = 0
  const auditRows = []

  for (const color of colors) {
    if (!color.cmyk) {
      console.warn(`[skip] id ${color.id} (${color.name}) has no cmyk`)
      continue
    }

    assertCmyk(color.cmyk, `color #${color.id} ${color.name} cmyk`)

    const conversion = convertCmyk(color.cmyk)
    const next = formatOklch(conversion.clampedOklch)

    if (audit) {
      auditRows.push(auditColor(color, { ...conversion, css: next }))
    }

    if (color.oklch && !force) continue

    if (next !== color.oklch) {
      console.log(
        `[convert] #${String(color.id).padStart(2, "0")} ${color.name}: ` +
          `cmyk(${color.cmyk.c} ${color.cmyk.m} ${color.cmyk.y} ${color.cmyk.k}) -> ${next}`,
      )
      color.oklch = next
      changed++
    }
  }

  if (audit) printAudit(auditRows)

  if (dry) {
    console.log(
      `\n[dry run] ${changed} value(s) would change. No file written.`,
    )
    return
  }

  await writeFile(COLORS_PATH, stringifyColors(colors), "utf8")
  console.log(`\n[done] Updated ${changed} oklch value(s) in colors.json`)
}

// Only run when invoked directly (so the converter can also be imported).
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
