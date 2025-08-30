import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LeadData {
  name: string;
  address?: string;
  phone?: string;
  websiteUri?: string;
  careers?: string[];
  reviewMentions?: string[];
  expansionSignals?: string[];
  aiScore?: number;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').toLowerCase();
}

const careerKeywords = ['career', 'job', 'join our team', 'employment', 'vacancies', 'open positions', 'we are hiring'];
const expansionKeywords = ['opening a new location', 'we are hiring', 'now hiring', 'expanding our offices', 'relocating headquarters'];
const reviewKeywords = ['dirty office', 'unclean', 'cleaning', 'janitorial', 'facilities', 'maintenance', 'reviews'];

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    return data;
  } catch (err) {
    console.warn(`Failed to fetch ${url}:`, err);
    return null;
  }
}

async function extractCareersLinks($: cheerio.CheerioAPI, baseUrl: string): Promise<string[]> {
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text() || '';
    const normalizedText = normalizeText(text);
    const normalizedHref = normalizeText(href);

    // Match keywords in either the link text or URL
    if (careerKeywords.some(k => normalizedText.includes(k) || normalizedHref.includes(k))) {
      const url = new URL(href, baseUrl).toString();
      links.push(url);
    }
  });
  return Array.from(new Set(links)); // remove duplicates
}

export async function enrichLead(lead: any): Promise<any> {
  if (!lead.websiteUri) return lead;

  const careers: string[] = [];
  const reviewMentions: string[] = [];
  const expansionSignals: string[] = [];

  const homepageHtml = await fetchHtml(lead.websiteUri);
  if (!homepageHtml) return lead;

  const $ = cheerio.load(homepageHtml);
  const bodyText = normalizeText($('body').text());

  // Scan homepage for expansion signals & review mentions
  expansionKeywords.forEach(kw => { if (bodyText.includes(kw)) expansionSignals.push(kw); });
  reviewKeywords.forEach(kw => { if (bodyText.includes(kw)) reviewMentions.push(kw); });

  // Find potential careers pages and scrape them
  const careerLinks = await extractCareersLinks($, lead.websiteUri);
  for (const link of careerLinks) {
    const careerHtml = await fetchHtml(link);
    if (!careerHtml) continue;

    const $career = cheerio.load(careerHtml);
    $career('a, li, p, span, h1, h2, h3, h4').each((_, el) => {
      const text = normalizeText($career(el).text());
      if (careerKeywords.some(k => text.includes(k))) careers.push($career(el).text().trim());
    });
  }

  // Optional: parse JSON-LD structured data for jobs / hiring info
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      if (json['@type'] === 'JobPosting') {
        careers.push(json.title || 'Job Posting');
      }
    } catch {}
  });

  return {
    ...lead,
    careers: Array.from(new Set(careers)),
    reviewMentions: Array.from(new Set(reviewMentions)),
    expansionSignals: Array.from(new Set(expansionSignals)),
  };
}

/**
 * Optional: AI scoring function (placeholder)
 * You can replace this with a call to OpenAI / LLM
 */
export async function scoreLead(lead: LeadData): Promise<LeadData> {
  // Example: very simple scoring logic
  let score = 0;

  if (lead.careers?.length) score += 5;
  if (lead.reviewMentions?.length) score += 8;
  if (lead.expansionSignals?.length) score += 10;

  return { ...lead, aiScore: score };
}

/**
 * Enrich and score a list of leads
 */
export async function processLeads(leads: LeadData[]): Promise<LeadData[]> {
  const enriched = await Promise.all(leads.map(enrichLead));
  const scored = await Promise.all(enriched.map(scoreLead));
  return scored;
}

const testObject: any = [
    {
        "name": "24Luxe Beauty Bar",
        "address": "28859 Telegraph Rd, Flat Rock, MI 48134, USA",
        "phone": "(313) 306-3441",
        "websiteUri": "http://www.24luxebeautybar.com/",
        "generativeSummary": {
            "overview": {
                "text": "By-appointment-only salon offering facials, waxing, eyelash extensions, and other beauty treatments.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2I0MWMwMDY5NmNhODU6MHg2YjU3ZjYwZTM4NjMzZmM2MAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 6,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpeAbWD0lwJ8aWgxWb219-pSayQxszHDsvnJUbs32_TgVSb3PiQEMwkE12rjxfiGr3-9aMXqmQAqjfKs0AzDov6WSGGmvVfiy9iLyeL2yfnJzJlPJq6wuSxd8hhXKPAJEWF09Vef58oSZXVekR8SITzz38E8lQg6EHABkxobx-hhOBs2RQiN8k8R6L1H20H_XFKNTMaF0lO2IYwNJzaff5FZ8udhF1qCfzsEXJQ3cTA5aP2YM2Fi7vxfew0-cp5vFbiqwhCYh3kRx5C2xx_Ws28tf-EKGmnnQ3OU5PArBknhYQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpeEh9qcTurBtqbALZu1UAofuX-nFbGCSzG6uhPWI_tyxkb_NuEyFEM9v2YQbCJ2e_74atuv8VFznSfuC5OBlPZa9zlDQ7uG8HMWGU1hbCo0kZcMdC-G7Mfiuj8Luiwcs1YkIbBpGaDIT3L9DHcm2Lcym54s-J-316W1yqxaMKoaKR9aqhvQ8P_GE1bsqYVNZqhqzpaDeLBut-OzzdiApBcvuvVM16qNIur16toPXUenEgBaNcI3rpZaAFQhCoMCQkuxe5P1sIL11Vs84C5QF--D9mBQwhUtf4adJB0IwdJNVA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpf6jbtHW7yGnd_JIoEJPAF4VOecpygdTTvB8rmQmTGulalw9djZeF3AiXxfBFcqe-8P-Jp-pADwQrA4G8vxDY8GsSRhBqRG5_CdO-o5_VSLQA0eh93CuvLav3BLmpPsKwkwOYvbdDbLq2f8DTiJwzWe_zV1q43a0Iq36p1MVrPbU_MlsMbrcUOIEPTc4uANea7W5x6P2ymfpr7AtDnPaXgmO_yqfLB8dMDanx1XwbFVEjMnOhKC6nIB8MRjF0yLDaqV_WvdizWK7M_6w-vj9aGH1qcgm11jIO6W4OHYuyNZQA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpey_ERg7kpmnkwbVSQpADh59ND9-wkCkSf9eRDIg6FMludbq1zb9aOSE7WNGNJRm8v9Qii1h9OvFe0mMlrlbt9pI5knzwC6X3sLZk_q6bF74G-624vcX5SkfQUK33J4VMYzwFaMUXw6C07ciaQTApOXEvfmWnRiraw84Cdgmu_mnAmw6LtQlBeB_g4eu_LF8vlhnzV3UWpanuveUzffE8DITvNMN3-J8RUNykv9AXgn_65-AbUx_1Ah9dHUgmpNNx-YeRS9iiPyCgDAyhnHCQr6IBsFkUTXt8PBSAzZlVIQyg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpd2ZUdKdjO6m9_YJrx-yn-HH5pJn_pzoERNJWE68B6gxh8zwXna0d-n8u2OLYH8gpSbZB0kT0XeXueLuU3oa_liINfhNIxepcvgs-BawYf_d6Lq74xt8hKaBxqgcOCtdFXkUPhpWTcADf0kC3bFkTcpM0a0nKg-i9Psjdbph8LhlKYNOr8a0yaMW91MvzOdKndq3bHTuASRcqNZg0A4YSCzdEppIWH2lDwNOVlttGeNQB9pVvaV9_oli1_aAUUgOY7DYwQ4Lq6rEYuU9JB2clwbg5UoozATlLVMU85eqzGYRoPWdKhUzIwUzakJ1WnEqe5iBFRrp7_jCXP3k6GGhxLnfmEPM2yCqXOmk7RgxMpqyYkb86kZaPld6bW6tm1evMqTvrGtjAiWKkDqMYR_W5uzg4CAGRC2gWW2EGgqR9lUMUTsGf7qfv0u6vCPUA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpf2cjvYTebqHRLIeB1ZQ34DYXtoAzGWuR8NHFXwPqFxQW48VEbrE4PqxfCRd17noO0X-bpmNJ49-DQj7z8MZHtYuz6c4R28ewbWqueOcsqB-2xNebfwJl2DJBIlRXuTLKMTZEEIrDoZCR-yQv0XQxH9HTavucgPg0-MMwXe0dFtfdrnWmya_lN6gE4iScuzA6VJVPC1147py8-KJrcCObV4Ykt7_CyqcIHUjBmj8EXKz7KF2DLKKwgdC6Sl6R64Wnzqal3F6MJDky_oi7qB3KGgS_fiOkY3ZBMVcI34JIgM8Q/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpdRTrW29tJJaL5QY3Cpq8ATmIZB7M5lrzI9AsK-TlfTrDKa33k9i2KAzeC5rkipm0FgbzesKmFsgJRq-1N6AtwDroM58Qn4eKH6Izw6XJ3Bfwb326D7mZiO9Reyji5R1aoNZdB_fnMjAtFvbewd12er1OpSu2if96ISYI4tHcdmf_IgwAhppztNExGfKcljh1eMqcL1R8i3jLs_aDe9EBXJz5BUQPzDJQAUsXyy3rZn7GjwIsxqB7Bu0QJdiTPaaF7Y0e2pRMft9HrMeY6qRfcH9Lj6Q7fzLXqfImo-a4AbwQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpeiCLNxKP4wIPRKnXztqNu_VNXUITrxT2GI5K4N-eDj4SJaJQcybodDzn8ksiwHz-IYShhChSFh61q23xsIqrpqrkwuo8WJaM1SfR7DPpOr-590FGKdjL1p2knCIA0nVSChQs1Yl56AUERCqg2invh7tWc-Bqs2qKSkn3EGSpQLOxWzYQWbM5A8YiBLSD2baJP0DYiubEiFqpFaxl7uPNwl_Gae9g8oualjD4BNV2mBzQl9PnLE59vlSgsUB89Q2tCc4_yv_fnJfTahGrH-rUo4Rpw-e3S25uFSfC1KEwDyQA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpdDnho-R7aIJfFpvE_9zupoKl_fokjFMQ0F9P3dwdBbpuMAtVsUvF1_f4QmqikADgIvVVYBhpzuviLZwK5aoW_5I3wk0PioyB1DcM1SfrbIvfZqdZUIRrVZeBTVR-clvLjbIbOeOk24NdSPcoto36Upp6i8IABWbKa6YCYsiY0CFfBQh6FV8G5L5j3B6QkYnISKsR_Qh5ZBZOaxhYlVtp500UMV65nWngXkppO9YbRGf5cuR0w943L3Q179ebqMH31RHYxVhG8pOJbLVPVyc4ZvbkKlcmLzTPN8Ewgqilfbhg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJhcqWBsBBO4gRxj9jOA72V2s/photos/ATKogpcogKarskjO9m3GaqI7kwuAQbcedD9JJG1UrrJCTW166SVpyQ_FIjUFK1dk_7KfxZoMXQj5XYeyPprswLsv_p6Kz150YBUcw6WHt7t3rM0v_I3RJTgR267gmtPwMAHDvB3ThR-EaQWZOH1HCrKwKu1atFCU9mfilMBhzohWdZzcGSpneNZYQ4dLYWIAYfoLF4mjlP7z_E9kqVWurkrejPeNbxJ8HDcdsmCTgVovboiOJpxi-pr4_cdAFGosU_X6YKE7eM7EYfipvIE5zgGgH7VFzErOoYdYpVgQ672H68Kngg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "V.I.P. Salon & Spa",
        "address": "15580 King Rd, Riverview, MI 48193, USA",
        "phone": "(734) 479-1166",
        "websiteUri": "http://www.vipsalonandspa.com/",
        "generativeSummary": {
            "overview": {
                "text": "Hair salon offering haircuts, styling, coloring and highlighting treatments, plus waxing services.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2IzODU1Yjc1NDA0NDk6MHhmMTk4ZjMzYzQ1YTg5MWVlMAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 10,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpf84MrowHd3Xsrm5MJin9kOMJD0qhEILdbvAjsizRwEt49DWYeDv7aO0y7mPkzVOQsxpE9US8ubc6XLTt8wYiZG1rqxDBk7uw3mqi5MRak3i9aEBaQbc2dfikS5WCeBIwAzeCDz11nydEhFkKNUAhSEBJgQ6KgzHm1JssnbMQLUihgwEhT25KMo_JMDzUZSLMOtBlShm2_A1ryIrzSZXJuh1dhu_Z7ANC2AV_ccaWuAvCI3iTIPRX1y7kxltUz1dg5SqkrZPnvQv44HenEVYzSPx1pqGRPvW9M8CTDWPp895w/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpeplmmfkdIvDt2GxZmdK8HuBGm058U4vAxkLqgH5eef9k5ZsVbByxETKSIgcxxMHJhTwb7Rpf6jv__jRLi6xqz-7N6F3gbLksoXMVNY4HBJsW2_zzQwqE7O5mQ2Ej0r8wbtFmhi2kSo5vTcDUXsHejUSnOqwJTdJv-X5YGJFpI7G4_-GOVxU5mB8kK4vsYGz_1BciEcMYZw6M3ys94hlDfTOPoWHDsGoJW7Hih8s4mXlGKdy10Gc6o5A49o9r3oTjpHOxIWWqP4nn8F3ei2q1zpDX89URMAomQOnsJU12NAVA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpdvAYQx_Lo6OL7-X4EjnnLBVgpI-QfktkaNON2iOD5PSbXH5cwzieKgmE0pjdA5fizQpzzopAfgrxNGivqrSy9GLd191T21p8An_hzq5To7DA1vwoH-iaZkgRXGiMmZXz_6JhfVDj55YITh20gzprVsZmMSN324U80Yk9z5D6Cy0NhdGsHOSQ4T8uAzD5g2O4VmuJ0TYGjfS-6zkZVEM4-p8P36X6OkqIaXKaPps5Nz9Ql8Hqreh2COSYr7wv2sklgBi8IZ5fnnawFFbKL1ZGXNJlMwiAyr7xdwG4k7qISo5Q/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpd6eud4VMmMUrLbr_mNnSDTg1gJxT8FJHn9GOugjIUD8kuyMPbyXZ-8xD4y1b1mMzIuHHwPRiGYcLYMHdL8wN2AtHVh8twIXXVyRkJ3k2e1bYBIcf5Qd4LjBEswdUP8zJim55FP5_tybQgLUSyD1Zwr9yjm4eg2YPZmzEHQ7GutPl7xeKFu6tWDGZciRosf_jjYRSn1ztL7blUa_uyo2Ywk94PGDpzDMNw66_EJWB6CsV2JHgsWPR1aIoeKw0Qeo0pCj2G0nRFfC2r2HjChKhiqiT430_1h-CgxGYm5QNN6mNXW5tCPeOai3ow9wHi34y00Al66TcJUGXdT0vZ6D0Fyta-ElUWwrUQ4fZZaXh9fZaI9Kk_XTo93KHq1GTdMYbfaTkmcy6cb11SjX9x5XQR0QC7IJTdYiJroX8KL_KuN7pZ3P6cC5bHgi1dVcjIO/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpeyvjEe8YUHOKtuhiqrJlqTVPbXqhO4Q2ymQPtcz8QRQ7vK6A6EcU4dKJQhiQ3cDHCxmiVYs804ZUJgMf9OTcsxcWFrQteWS2cnFOLK13ivwObnwxF73FvIzpWO3_DXBKtbOg_M6jtzCwziLhkbhBijX-pBduIeDYK4gtCP20dnPlYIvnIgWpFH-yjhSMnGieVd5KzgLMOE4ifj2ApwSuEle5PKejWkwszvLaqW6A5KpxggR84neJL_MYv3BxpoD4EDR_NnVEFZKwCln07f_8lZm-tPXrpCBeaVTTJUzh2M0RnhRJCTm7xVMa2LS-OCNTWbGXb1MBDngJwbPxdu6keb9lH7-_SzfnOOso5q13MbQHnG2NIDma84mEIGUx60KEcgSgNA1MCpmTtFlJk-eQLsmPVzqR-QUvcL11w_5ISMN4834-pVnhwEf0NJ4R17/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpfxFiRDKbYjYFn8tQ-UVUau6MsT_ChGB84GfKgqVs3x3ZO4KLhGHRXMiW-dXLVPi9s3neGubhxm8dNltw6N6xU7JmHJmv4AfLIkWF9gpb38r-XWiQZxxg3vyGBDPaZ-FUHjNJFQ1fJANXf7hXJPDng7jisYP7P-gA2lB26G9oQEBRl__YYvvQNENWWzWy9IGgQk7o_e9M7HDaiNvFLMw1Ra7sO7-HskrAWR4IPtpXa3V5G-S5PGuBE6o2PbkRimlwNbVXM7ZqsNU9_o994KpyeSGZSjjz8OdGEgK0Yxh7W8Og/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpfBuHAPek71E7oA_uaAzewPzntTwvOypRyrSJlFUcvMNqp7gveCHVawT_NEQFmc4WP7usyc0NuF3T_u6gnIwq9yicLSZZ3h_GhJIt9Y7FX7gyc0qz_PysmrqQHAIayqOdPw5FlFZne6h02siyYza6a3qiWc9l-kawaSpXR8DaLQsMj42FdJ1810Q6_bC9TZLue3-0qydBnCTo7xPUVt0ZM5NROsCjKgW_7sQW72aB7Q6iGxi2CxLYtPZ0mHr2W_h4lPkAWGKAbdFggul54n9-LUWwWvi35sDL2ce-FzPqkAKA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpdetVsG9AENAG03UsJWvoOsFypEBwF-2nppGs_2ljsFviYxJyZ2uynwFXGGqC5rU3sS3otVZnD0vqVfNKd0HUcCrZyKRhTU8pTE5hbMRZqZZ9NLs664rKo3RnZvFMqyLDdb3REh-Un65akRqs8Ox2oNtAineW-Y_8aWkoLXTrKZsACr_TgPpv_yjNHMO7XDKc5MuOfmJAMnsjnmuhGUvtD3-y5j01DNpqhLPAt-XFRQW7rek2caJvzRQSyTgNmMwgvYlGQcv5eMzHKsd00Y-qeNRKJAw5UfTsfUMHR1yYW41A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpdEPk8paLFLNCM7x25e4WJkqDcAbjNRUvemNqm1cXCj_ONNzS3r_KMB2lnCMxi-ejgnq-FO7YI97-A5d9QhL4N7CBOyuKFzVJcNXzHQfT2wJGXUKgPOnvX8DcwzbtubKzb38-6-o6AInrGAhxtWbViTdd_7v1gCAubKtFRgpYouivStZwKxydadicYto8jyWogp9rECfDEpkkD1gzXwbEITEr0Gl_Q5mWpxo4gDVb8eVWBC-_hUOU0A47ybbkAN1gikKOZ_FpwizUsDYDl9j3UTEa8H_YbCEaRgdnODHdiVHg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJSQRUt1U4O4gR7pGoRTzzmPE/photos/ATKogpc-9BEmUlTH1qW1RruCiWS2W79Ll0Gl8aNQ00chQysIGMhWcgrXXwNKzM7-Ojv8XGKmJon-1TIdQ1zxNmQjXejCZCpKcjwh2TnycqYuAvr37l8_rb25_ztVkzUBpzUVGVTCrBUnFEsi6yn66-_0uFwU6SgZ5luPSRVZNJ3AmrD0PnQFn4PMVswvq2uxm45m6B8XlTRe_9yOAz1C-jwa6lE3tmaO0E4ObIKZM2hJ2OjX4Rlf1Rlg35f_N7Qgwa6dcOrd_vMQmyyZDsZ8rgy4geWoGob7aY7-bv7piiRb4dp-hQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Re’Vive Aesthetics Spa",
        "address": "2364 Will Carleton Rd, Flat Rock, MI 48134, USA",
        "phone": "(734) 355-2274",
        "websiteUri": "https://reviveaestheticsspa.godaddysites.com/",
        "status": "New",
        "score": 24,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpczwTk0OXfp5NjfqSTRH7ez_H7TdhdH39ok4cJMvdOVeyrb2tJo_p7vEoKJTXNt4-JThf-AVQX1kX0Lku6FhVeI1wA0ZJ5GF9j7YpXl4BJhmgM-L2H7vJGivDxuEWWFL7QeePcEw7XuMMjp_wtcPZp5qdwX1kVEskvWBIbZnUX57srLKQcX99gssECrtMDOVox1pQDBYchZk-nbXhlwtmB1yUJfDf9-ZOHaM01xFoGnb8wjq8EwRpSmiwqjlXeXidDG5cMtS8XrO0ISNCM6UhKwQqR7aV-rVk7TnhMNI_QZ9g/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpcwQRH0c5T7Svx0UmYhDFQB4bx22gukZSkzl-5nA9EEGVD3PAwyXssZcttzPgnkhBn7hqQ11wqgrc8D2ft5N4uQ4IeQsxS8-D3Ug81y_7HfKsVYrrvp1J2bsPXrhUjvLy5EohWTt6cKp8xvEOm__uW7X6AUGQrztBP6ZFr_korQ9kXjgsbZ-ibaeRaI5LIQmxZRt9KbFzXi9j6D5CmpyJeZnd3CBfvc65ZOV2AMPAbUTJ4OBx7zwgq2ujwX5FET5zLU12nIy5JZFHI3cru2jI1Cdi9gwdWgsNotXNfvToAIkA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpfvKV-TPMaHYempQhmu7o8C9KWbNvP-z9KKTpKk-20ThrPrZ-fPOiV73mdj0ReMjNsqloBNfNMH66vZ_1PptEugTawfs-5VOk5J-SYOBpboXWgg6xZGK-WTC__lpivWwlug-Cfp7NWEgoQknZxq3R90k5mLW2rUxye6FWeC7HrSjxoKeHVBsW0w-QE6g6JbTnkvkA0zkVegE42sJ0exHFa4Vs_W8Z826InBz4u0MgRHx3T1gScG64MX0s8dCA5yxwkmEG2oxSRmkOvGyeAvZdyYRNYhXNFa11zMp454ERRRLQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpdB6oOoCD9MEQvjvCrayqQN-0M6qIzRbPXA4e5j250FgrCLt6FJa9WzaejF_oicP63_sroq6tWCPEot4W5GldIXXyBXgLnAUOS9Rwwe0pBhy1O-tbOP2qssALGTCU9g5pFehfS0mnwDBRAbx4hGxQkulcd1tKTGqQ8JQMmkqcHEaGrWo4h48ZoQ8jI-2ckPrdFbYtEMPFpdsAcdasP96DLp5FAiluhcL8RyVpjPyDOc6f3yf40lzrjIs4Uq85joU5Eu8JTwF1OmfFCjNLmTpyY_R0Rj6Dp7a9rLDQxfcePIZg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpcpKUwjNF4KKY1Lwst9-GDPduoLyfHZHvbqQxkfnFF7Gx0ELiJCUBWnZV5uM-CNS0JtBPnOxXGb-ueF0UrH1jQhvNnR4qtA-o44M8alIEWptnQuT3gA6xRIrkvkvmgEEmQA45jdPrvJFVHPY27He5B9scQdygYgP1gaAMgG1YvMSCRJaadNgpJlflPAnumK2SBBcpShj5Q5OWYLaMeexTfbaYCm8y7opyP1kYmGWXT4z0IUYCCD99yYvDEwQjMLKlxjh3PVJT7GZZMwqL_1vHYMzuVLfGK4K7TVYFP9rw58hg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpegEhXo3AR5oPS4OBZQDUWIfEigHQis33iV8qG1aB2l3FnJDqWut-T7QuUkRfkasvX4MW4DEHk84OPM9cCo45ba-GBogZg6yzQVK7cKxDUo1uwqJUw1sncS_JCbIQITiixbyd2_GyKsU240pYQ-me9Byw9-YlgduJrMWdm5s9Wk7c2kz_GWl4sFkpo0Oi-mVyKcLfj55N3Af0TyexCTzudqX9K15yxqBO7Sivj_hOCqeg6HhHg6MR65DgzTM7h8C1ALN4-aF2qdMtlpPFuJCnUkC1mE5hORbU3OLc8qIeG60A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpf9yqSczDven74SraAuQbbAlXsNz7izxmzcDvW1dmzqjFMcGhrjouLsrKUdh6DIDT35iUYzZQ06EuK_QRbjaETg7pXJ2wfmisdv58vzWbnXLFzN-k4HBt9Mkqe_kvU1DezpQUgz5GRcgQ_HBCe42yKtak0LsgSNiPwqeSuh8VHQzs4u3kCi100lJqBWYLNIppGSzqJY99P-x7zRPSCc00KmOuYNibb3XnvoifWSXdWSGzcsHiIZXzbcMGOEznav4la-N6N6HWzSu0F5bBrpQtIipPOVEjTuk9iw13aKu7Hnfw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpe3Fz9MAu40rtmAKhVxT2HTKLXmQXwoH28gsjjI2VBII7kVaUnD6mP7pYigWlQX9bWnedXBy4xPC0spqsslD2lhTADqo0vMUUpZGM0ER2_8SUH6d9qMJAv8jEzqFkOWKgnq0_1VO_c18lXopMGO1wd6Y4_Zm7YEEOhJ8UA4U1LqasUH3l0H5KHEZDgmFGT9668fn4gaMbmvNA7lRFZWugNcgGBh6vLqXkorizkjBMEoBDrFBit5Uc0eJUv1hmihQrfWk4DMJyMMZlHmk7qrZ9TSTyrhyV82mpstx649QqeImA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpf0f66bH6DLG8AK7lhChobMbcTgLvtr4GI2SDlH0-bxo-z5rT6-1vCDH-a6iZZgScCKcNH08CjzrWks1ixZMygMye0nRdrEi3m2qldMU036ITOnjKdsAQsgFuyDnAbiXXNFhsF5kCgY_DoAns2RVhxec1HoDXRTxOMYKTSqsmPCXoF_KV9tM7tEb6eK30V7KQBF80zMyRXPdgJ6lMf4KuHFQkHTpTx9fK0Xd9GCQD2vm-AZJmQqobYZJhK4p3PzMO_1GnX8Wr1P6TMXN401G80lg_HNIEn_d--p15OKvcA8OQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ_20WYc5BO4gRSs7qC2t4AAg/photos/ATKogpe3GKGANMeBCVQwmuzXDb-uo24sgHdsEgpUTZSjh6vSx1DRY_GcRfNpqtySoo1N7LD378JatWAdquxQhlgus6LVRI3vKoL6htY6JVZ9TKFKtLha-5aKQx4vdlf16k8RbQIwWvSNuzpcM8am8jeGvek6c3aZR2KKDgoxTfx3GpiPgYETwQoBfOUrSiCvi_UXuesNxXu86Sf_ywa5QURxdq6IMPd_pgzqRXb29BztHob9G8sSAUzuQZHZ2Tl67e0SwMOBPCe-tx50kxdrAbsVhIX1uJu8L2GuhZBc08fkdfhJdw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "InStinct Salon",
        "address": "27250 Telegraph Rd, Flat Rock, MI 48134, USA",
        "phone": "(734) 782-7033",
        "websiteUri": "https://www.instinctsalonmi.net/",
        "generativeSummary": {
            "overview": {
                "text": "Salon using Aveda products offering hair services for men and women plus complimentary beverages.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2I0NzM0OTZlMDUzZWY6MHg1ZDAwNDFiODhiYjNiNjA0MAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 10,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpftjU_LnSPvL7cc5iwh-z8kzWlvG1i52uUSw8wIbrYMiPfRYE0Csu_90gTpVm-b39zFjErHFXKP_x8f5DcSxyCvRTfAQmqz2iV0xtwvRNjjEC_NfH3b2hRXyuBYW-JdZUxz1zJggVyzI180yOrHWQ5nUEvvsQpYyovE7s56qokeoHLgfrIxTRxJRvKAf-dKs64_DPAVwg9_-hYvWb7KWqvqA_JO0ZP6YdZxuEml-oMbBvBSdkcUCy3_uViGXa9n8gAAzAVl8vQEEjUATMxXugwsmg7a1NmtX4w3vI5zGD_UGA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpceJ35SBsSxVfmcUU9ayjwBt0v7MG3HgBDRW2Tn3bk31rHts-HglzBKX3q5nEytx42Huos8T2C4197Yq-p1pSWHJcerzLO5e_j4_tITFCZQPzPGVZJfcsRPxCvafm_ptiH7gSAfV5ukY9fSgZmMWEVmQCpC_Ef1lE3rcaFFJ_ydtXFQXcQiWU__TApEmQfeeyQMpeznaNyxk6j7RYxwuRRwwIMoO-_JQOPPO-S7rpXjRGZyb40jT4equ9Vbrw8JEvEnCVSzwo6EcMtAErtsVrFFlASEHw_0K0Crj2ZIg1ebUg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpfvw4EtbUoIUsjEUDgLnmKTgEssMoKTZsomfOOhPdC4fCoUi4i-q8DQLj4ZDc1RrY2w4Zq7C94jOKQXhFzA9Khsj92BEthWu1TM8jJUXXiY3QtOKutDav16fWLgloA28nJk8OOvxye6QpyUj7O-yWxmLfncrr-kYBVBf5lgzDfly2aX_XmZrRR5eVOH0u9WjppTYoaecin94pp7iGNGkX2D3CR3Hy28jIyUE0BsUXLvw1ol2EQ-45UK_kVDb9Kz8-otGZSq5nDXOMaVfVEQRfh3Gayb7PzlbohHjwGQwh_Cmi6eTbxQpSSYUSDH7ASDNW42EtUIAC4GNPZV94Hnr27l3cZCv7IHOj9d1VRadsUDXq9ALIWL4NGsQS0Nsb68yund8SCvI3LvHano_uFs27bBKJtURsqBd5zFB7BMTr5wrmKb/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpe9LFuK10PRSihcfF-DhLWQE2svqYM8hkijeKa9zyfNv7uA2BcbfZjfcCGIxZIddTdo4xS_isrWKnb_iAIAhkSxK5IRmEWnk8hyopEsh7RNhYQ-OnTyYHJ8i8rzz0Sx5YJKbCPxjk4omiopX4l9FvAKsefkULC9N5keblDbUwOoj1I6zmmIG_zDrjiJMDcrq80GFoBnswqDPH_roYkg2kWvrmKSXsO9EDU4YuLLNnGok1N7w41qY3luT2RPj2HO5gb8Hc2ojC07uD9y9pJ_Gag84vY-tt5wy47lk73smLM_2iJVe8-PptoLrmXkwDzApGKVekzFJE6zkUWsCsQkU8FQyiEPGPSEHFPWr3f1Jn1z-8vIQgKUDnXq_Irp7SdMmtUydekrAUOUPtXFh6tjMFH73zyBQ-zkNfM4WKIlLcjLF10/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpdndWP0ouedVEVoGTk1b7HvJyN50rHw0NuEcGPGhUC3_lj8XacTPbRa4cDx9arHY9orjgwWMOi3TOqPDVoQXfIUgfEiLMyM5VNZCpryhQufpwbgi3skMJR1knibGvnQo9rByW1MZq-7O_UjMh2bcPbks9VY43zwjqClOfrpDJ4sA4HXMp_4L8Sbyc3R1hbTATkoQK7ewmuq6lT7Rl7Ywz46C3085B1D2-JOcvqT8fgNJJX3GTYnYciziGTIaABOhLkfMfjREdTRdA43F8Yr_HXVJEgv8afPEwVepZAoLJBc-Q6umoKJnt5PcIae4Rs1R5dyVV-gCFFBhZqK2ZODdxxbKbrSbbARdx3nu6J3ZieCkzqQlxDgfSZZ-hdZjzp2dubjX-j8Vc1KOjPn1DpB3JDr7K2Isybr5wYxyJb8hiG0FQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpcCBAg98H9RgvQyg2kgmYvbiPjLwH713s1GcwnM1KXQAPMI6b42rZpiUek-5el-Iw7VVoVfN18wmHkeAtEIdgIJAJpTSUxqEQruLTHq8KP0uz7iwlyONoapTXSwnSosBUMWQHDAo7fUrvDPafE2JvnJ6l8IdSt_BVJsHbv5foFoeLg8GcpnGt--mDtIyD6NqvuadLYNWkmT1qUqhXn87kOesEXREFFueYgdcaR2z8XKGUYhTiaBsxI-j7N46OUVVpgVNdp9LUeRz7W9CVDPfmetlfCQ_HiFfOy7PvJtsFBpwDMxX5cFdD-sUIHs4oFpNWytDQosillZibGTvG3k1Vl8BHV2cNkE2ElAw8zMB1lKOcIyFpcGxtMujafRcydVOML4-jR3p9XO1EQtX1b4i0kr1RTHiM9D43kk7R4o_I61tg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpfCG2najtH_eC-VTsHOZjFwFxSIEo2TAZ-oESlkJo3m8ocvd-dl9qkUF5tDQr5fr-ZB9-9xroecAso7f_oh4KSQB_D2ZseTntMfZOogjC6BDXwbbuxI15mylAATk5inuanPZN4Rw31xyV5dpOWd6A5EEZX7Q6Uo2a-Jk6B13Hz-6OaH7Aop6E-5FBJ8Iw7tOfOSc78UuwZl-a5PkInDzek13X0z0UJkymFIf9KWTAjOVkAUq2g7Zssz9TokRhJccy8_E-MSiq_WuQoj6oQiF8SdGVOHiPrjIHVMD1XNAs-4mRaVHYgYr4ibYKBjU6EtvZ817cYiuFk8I9iMtiUPvUuXnmWuVh_v6PM9jV5C-d3gtAmlqSe1ryux4JssHmk6hxMYtItQRDUder3PronIPoposwaJIqzA0a3JryZ2aA1jax4/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpeDP5REfzwWKvq2fmgrOJIRz2n2RjwsCXwk5iQyhbWTBpA5p7cbTnHYTZTm3T3d5ruueoJOhCaKH3zgYAb8CDulIwl2XRUrPl5j07BXxBp--Ev_GImJNZwBmjMJ2aJrciLtzqMIcDznG0Hv6DKXxgAllC8fn7gWa3jdCwUuH_CQzAsHOliqcDPSTIrg4wJjNIzj0s65VTSna2-xSyN9hFCXPoJvQGspdYEAW0nw3Q9aSUGz0Mm32AdGL3Sj9bi5OATe5gqPUXi6cMZgy_U3F-1sqfcIqXYLyBLTvhaWJUnevbF-sw7gFRoZFsZfOTgLO0405Lf8j2nm4qY1PBXJbDOuZZtjdTmZlWyrz5l4r4WzrnapI_Lo82VOgdWehzScF1mgPUH_Sxx2nz-tO6kANETk-kUp_8OwXEgKzPLNozdDbIWE/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpfcJXqAPH5Y3e5YOw7glfKJIFKcTqqTm2sijNR-ke1jb-h22Megtb8XVh6ebI0_H2eVTtvW_6WPfQUlBl1-O0Xa_ZrHoO-9BPeFlzwGUDz2RPCCDpAcEwAXybDx0vvpqlofw3DLeaKSbDkpWPYHo_BGFjeOZFZcN2OdFKL7sSEI8ARl8hDO4hQqDYmlgS5ARJ0JtJe9cb10Zbz1YJVWzLUquY5QCexBRhpqKbQW99-qtBSBhy5u4PfkXzvBrD6ZX-5n7Hd8k3ZgZsDLrSWF3RlzKVtguoN_ojJHh2hCxMw6ntfVaDnJ81Z_iCCcjDkGNG3_4QOebEyAFbcz6o1DA9UotcO0zwHfALIlb34_XF6AmG5XRIgTGSRMPbE7zRMXKLdlwajQidMgnZzztIBDoZLXg86_9M3Oh0U_WMzqOT_b1-0/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJ71PgljRHO4gRBLazi7hBAF0/photos/ATKogpccSLAsDlae1IovInQOfdgH3xggSMP9WPJsHgZGFMnc_iSPEonSSFYo8aX0R-IeH39FzUiNaEgVdxnkCEJ5uta3oiuMknKcKREe_p48JN-i9r4yRY3kWMW8DNU5w_J9CghXaNCM0n5BNn6d2ov01o23yfykEw3-5Y37eHpXjluMWUSIUjdSnqPoInJAGizfomLkCGwZ0_5IMztbFAxh0cdJTtv3_MaiygRe7vPDk2bTrdU7ANcYhq76P2nv-rZuZG8PoRVGxD75SS55eOuCw_gNgQK6MWdjjvBo6_x5SFmQw24o7zWNRms3OUgOw6yg8vuovbUr1wVyOE0qiZOwZ6WxBPc3YyplqZLMlBsMEJn4cpF8M8nBikRkZTE8dQmJMwUd5ctGZ0tYGwSzVRQY2F77Y48hEfFN34mChKtYiUly5qDk/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "The Mane Salon",
        "address": "26154 Gibraltar Rd, Flat Rock, MI 48134, USA",
        "phone": "(734) 795-6019",
        "websiteUri": "http://themanesalonfr.com/",
        "generativeSummary": {
            "overview": {
                "text": "Beauty salon featuring an inviting atmosphere and a friendly staff.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2I0MTg4ZjkzMzBiNjc6MHg4OWRiZWU5Zjg2NDg0MzE0MAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 17,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpfkYK3bOvmxf0dmEj7CRwxA9YUU-SDIgjGrZN_WJy804M9s_GNotkviSPCHQLECU8-EbVQfMkfV2t1h3xjWiS5JTqbf9K8sTms_nPUiu_Ci4jaOyGfJPLiah774nuQoLmr4_Uy-vSqZNP2PAQeS-WqA_E8ZxlX1mpqOIbZhqg4njrcm12gU8RulaSEGyNiLvS0rvkNfscewibqZ5fNIlAk2WDVLVYuejQx7BWjf5Kp27w9McvBZVnl_PQKyI5JgBXm1mjWhj7F0LoNNCTKgTPLENXdcdv1KxvTGXLdcM4Raww/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpcZlwv6BYAIZpwy1uJ6gSSqwZJhdP7H1HCvVBGX3OAZvDZU2R0D4LLDuTHR9BLytLWlini1-1pFknaAeYyQdvwNpheZeipFLuTpd0j7PlJ8Y1YPhKctlQpTNX_ytk7nDJKYgWrplbWIh_6XeImPBTdCSG7tYHeS6kDBldwxBd_G3RjvU_3RoT7TeszWMyJzp10PErObAknwVMJ-j9Gl5rycPqzJIVafh2-CPXQcn39fUtSfYPt6Syp-8R6pq_JwnyXf5ApS9PeKP9HyVZSmOwZqgMpIDaCBmAGaq1eLvoo1lg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpfH42MQJiIu6ccrKmOm_d2dEUcMNoOpMcWigLpUKjSAToJOjgcWsfqFvFnl2CBKYmGsRc_oQxyZVi3mgenj2hx4XCtidvED5wJ7PPgvt495mB7B_vS54HbVX8WfKmP5cr-7UICi-NStqAP2uEpsqNRycKuKXgwlD-StBoFM1RqeBT44JW-To9I5uyBysNOQjAKhjq78GtCSZ9a2zbiBgrcYgeuUvpunV1tqai_CkeodyU88p6NyiYE8_gkn3XPekqgav_WKSjlQnMAPRKv8PZarA2SRI1BvfdA7p5e4dNrdqtSr9wbhihQ__aD2kkwUCHiVSIFJ33OITmR60kXcSDks7UvziGvJnBeRr8xQzpkIzdbMzKeDR5aLVlQ3Q8PoPI1gh-phstp3oADT95-T4xb1u8EM04Qhzt6gZ2GOcezvIQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpfTw4aakoUdagXOZVJxO5aDQ1ZZiAO07VtK3xvmMHpnVo3AfVwhx9bT_2BpeUD-u0fQek0q1SQuRansf9AaOjcmGMDskEEuhS6Fd7krMwSOUyUA1L6nTf0TRu3OzBVGsLlmQ1e4m5_8choRD40ZNDu5sMVulZSjvhYRBYMW4jLiUVWJvfYG9rbR_4ScQ0QOMAjxjgR3uEssI6uGO53cBr32F7lOf1z8zXWtR2YR24nEEgkVk-Cn-RUgLY2eRslEELyJ6NndKYVr6m4at9tQ31CGM9kxShnWdbbiaE57MtydYftXKJSQvC6D176y3NgZA2WH7XVs_y6ZVWjAMEvzirQ4j7T22qKhGY6KNDXNSXwwXkrEwAgakPRaqo9ELI9v0lEfGKlCqMSwkp6UQ7HJ66xOy7nrGveQxNG5XXryiNSax0o/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpeTsEpWhuJRLuu2cMbM7YoZmMNATpVXJS1UL74By2b0KnwuDHzBRlLt2vAMa9hgOJ-X511Z3du2RjDhxFZKpvPhbX2JusKNlkELOM4U2fnzsCkYykFKNofZdTGuAZXyW51uuUeFeKbgZzfRs7UWaPW4V3Dy9rXUPXfu6xRvA9r_QlQ7T9Eyl4tMGZM0yJg8HKcAnsshIV5EM1qo-1NLrFGjXznLZyxGATzcs7CTKfaBfNkroI0Lroswhcmm83q1110jKGBnk5AzFc_rlNtCd2Q_hBBYl8_9zzGu0uEcnVW4L_iXT7oWMwieESVuzO8rMU5xQmtJRa-pIKH5zlJOQv3la8wii2RL35g_HxCq4tKwVMoee60_aqh7S3-wLIP4V6NQM_NXq47jPVh8UvNELGcFe1Lc-4b95JYnfqXEFQahzU8/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpcOpwJHMu_kS1efNNyBNMeDVsyhJbVy7sij1xbtE9eK2tl2MqzjO0vc0iMwDhD0V1RfPqBcsYdlX9pFIbKUFkDvlJd6Z7pa5KzoTVCBa_ml46togSjx4Y6nq76jaRgYm5fFlH3uS-pqZ0fqm3lfDiyiroIvEKdyE5PEizoGTYYhoZ-d7AjvpFoO0NdlaQ37blugHwd1txoJF6KQ5yfAlKV9hCstyd0g46OkEYQRc2rOtRAdABvgtoS85r5TrHk598_aJ9DHTrYcFxBkX7KdNY0sP3OOtjWq07UeMZykhBF-q3Hf83kGaEAKz6AddvGGrvH4ifH2sBWYGiFFKllpyUY1-LhPUSWqfPK3UBzM9DEjUq9jCTArk2Wox_Vn4BBNdE3Wn64fxHnMZJNBvKhHJcPAb79vz14NU5mddEwHuSpN9Q/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpcEdPh0oDTjp6MqerjPY-0BN6CqYzO6MeuEDdj_-1lGMbtUrGtAyjl7-FesnAMBlk3J4auj4RenENQCeXEDdnyChBKf_DRQNeVDK_EhiFarHF_uYWN0Ge-zh8iVH8IVbvKnmvMguGg7s4SKb3XfTUnhLpK_sp0dhnj5zPLlTBYzfjEhD7q7RGnS8qdaGfrGqycCPdJ-ehuxm9KIsiL_SJdSrn-91KH7WgBOLFf4TPW-ML8QbzW646iUzOh35EVymAl672frQkvMgBaPeWOxsJWaTNkDO1MB1H2d9uEaPKga5HpPsJdQfBRhiWjxErxErPJTY7CxBqhDB85nvDjZMEeiTe-xzqeRRmJaj5qTSy575S1hFEln0w7o9n5ZtPb5lKmzERxo3YrB9mVBTc4KcCFxhyjTx1vVOB60JLvl_ctDJwc/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpfY_Jq_87AGDpn29Ctr6oDg1I-sgXmfDszIGuO8rCF9dwAqV5q1WgS5B8qGpwCY8PovQoZb6nyx61XSzSsswaS-A5IJV9Qc908XQeJJ-XGEXKIcIWEbWVOsO_TdjnPy2URGiN7ftd1pTSZoF0VmW54vAxA5UIjd2yOEOUit_BPj9MLQsvtfo_pBMOh9wgFjagGWaY0XAtJlhjzBckHXIEsV9emvNWuyJ4JM9q5z9y_9xW1SrhYyoSAiTXjfj4M1N2rTx99Y4tJA4DZ-E_gGIWtZLAJ-jL1Xd9zH7ybaJ9nyiw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpccy6AlMHFRr0kWgnM91-l2LThNS3y7gRyyspDVuqUiD4defpDQJ_JcUnvtqX3_BepOww8sfEo5ZcKNETJY91LjfMipGNM7LPUxkwmeMYbT3kugNjuD-NZmwSwl_ftDmy4lVL8ka2d1BdEfkQnYUqFQXSJN5qHdwkeXHxO0Kulf7_hUitUOUWNofDMRhS9hESO6Szwpb1vszuzmuJwLMNOfZFvTU9iLcdHf6p55h4_xowA5sZ0IZqJSZMerejzxhmFo7x3XLCFxUnIaQHklt_UELNRXbrwhWcuQB9sCfwiLKQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJZwsz-YhBO4gRFENIhp_u24k/photos/ATKogpf14lx2W5LZfQf7rMmhB1i-3vFD01C8Y1K_V9MIGJLZ4Oc26uvrKY19EGWmde8CI3kBPSJ3E9O4UCjXzXXBaFpInmGx-Mp7YBmf9Ivnpcd2OamxO9YKPJZ3hejD2ssvAsISlhHGbwHu3vHgN6yM04NUeaAV-aHchqAL415mVd-tW9nTBh-dDeY84K1zNcYWCl8JoStP1BV_jqYOWGWbNBILlR6Ap5ryUTo00zaY5IOyeMtQUFO85QPa4TKt36FhP8CVYQ-6VXmfmt_GgKlgKAWZgNHaTebqUMMTBpy893zL0g/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Top Notch Salon Studios",
        "address": "23044 Telegraph Rd, Brownstown Township, MI 48134, USA",
        "websiteUri": "http://www.topnotchsalonspa.com/",
        "generativeSummary": {
            "overview": {
                "text": "Beauty salon with a cozy environment filled with independent salon professionals.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2I0NzY4NGU2MWM4MTc6MHhkZDBmNzBiZDM1OTRmOWExMAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 7,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJF8hhTmhHO4gRofmUNb1wD90/photos/ATKogpcRwiHgdRX9xr_kKw1y2y3ihhxKthX4ucrGpOAPV2TzipFWoA0rEVSBjEevyhRzdUiWTthklmFe8_vKOnlLRE5xE_f5GR6KPTFI8D7ziFFmtdHHhG3ls0AXi7B-JRX7kV0G8M1v8MYP2Ji6bnUfwBd487yho_q9kKSPUxUWfjy2vy5N_lxTlWreVPsI8mVoDDmmul5xva9aeZsOjzM2Co3y95xvIB2Z3NAuQD52yj5WyWAFeMjloZvBG9pOR5m8LnQjMiL9ZlU1cn3UjMwgEGFjYO3XrPos6nZObNlx_wzfqjODDYBu-jdkQWWQ2GgLeFTcqKq-U_Y_N4BHzUBymQTsmfbYIn3m7o9-Vmw4UbJQ0nAm4_CWK8xlCo3kMWHSH24mBLmCdjzl_HI3gg4BbHwTdW5dre07QwpyDcA9iFVeVg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJF8hhTmhHO4gRofmUNb1wD90/photos/ATKogpeXWq3xdvWzTeGZLGS8rxgp50jvNNXLuC_GGiv1jgLtzhIi2G9PWnbq4ezfimLzzYqKuECartJJGsRuZd-SC1goUX0nJm6YoWJyoYFWfSp-vmimafm3cWNGn9BjkR86GMvSchSxchyCxNiy9qsmZZ5wh9AneE4diXH0zCzS8CwjxtYryakf8fJ7mSFRYK1OZGDY7oPuwPHBKWCbcUujbC6WyzA4M39FziHdzePQv_e1-gdGh2Tq_H_Gh3z1QoZ7TYtsg_SHSeuOu-fKS3GAye4ltySv9hbGRG2V7wKn3aZ6xAPdmQc2ikWk6JDCqWi0bWhxqjwxQb5yTwLPEFubo3i_8Ixx6qLHVIsEFib3g8yDmgle27CTmNBKSLZoLYszjTY5C6z3qnH28aEXPBavWJ6Ccz_fzG5b29aHqrsv3ZIrBVk/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJF8hhTmhHO4gRofmUNb1wD90/photos/ATKogpd3W1K0zCL4Rnl2Kl_x-25JS_EOVFZmFTVCk_h97rXuUfA75EdxcGfMZTJ9S03CyzQuTYjllU2iRAbkgi5dMqjP4rrhytUh7h9QHfgkfxK441L4m2v7KYx6c5m8QGALGfCv53smd-Oh0jdRq4cvaWqe_4QDrqR_eY4yb8Nxg9c6KuzDzT30OzyUuX1GrsYsD_FQWmVGOw3e0CRWPEnYA2Sf7wkJVCJ90hLdAv0RcfaHSFh0jlr-WgAqXLyIzM6XJsPNVEUrxdXgCZsdwPe8fRkalGpHcY6PDo7-if5RZ-zj1wRHvfyqB5w0pmJZB5vJX1tzMbgsQt8i-zdJW3XmiAEl0psHxHUvDX-wsDdBHJeFMDjUpatLoE8V9mdaOnCBpGQ7vjzo82azbPcXebX8lwus8eT1NVJ_jLTe9CBIhzDzwg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJF8hhTmhHO4gRofmUNb1wD90/photos/ATKogpeVuCqH11bfUwHWa2HKVR8QiXXsoI31r5CrcCBEQrdUQ06v6_vldZI7sY4I1VjnDbO92GHZ1xGkxQJ7l3QskeqYNJpexRsebOv-wr9bbCkmL2KHGj1ve7GJ5MKCbotGMxL3LL6W1ArbEJ2wAUPSzm3nT9ov4lwvQc7ni2fh8oKCH55_v2SzxcCJuDzWAMaB0FOZgA8h8UfRHwSaqgCNeUwQBc7pDro7cvqXpdBkwQj6Cz5GUH5iTfvmNapIv1CUDZEtVM2OBBqc7ZMTNg7mfW7LYYODqK5GbPygjbTM0zhdpxHggpBGxvGsrpSL8QaZ97GWJ143073q8upe5MVOt163fjH0QPNxCSAPZrzr4EOGGGYYJ06VmArOjr--XoO1Xhw0PttXem2wcSPiAy-GgO69FYoH31-XHF2dSfdZd5RKyw4/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJF8hhTmhHO4gRofmUNb1wD90/photos/ATKogpdz_MltucZOEsn73M9UlFPkWbpNFQPhgTFFIlJwJGhlrlvo-GO2uz_NOTmujmLOthDg5caWJOXeiUFD5vumEwB-mGC_jVD3K737ZJtOIbjiyuBHTEgFdwsGwXEDgJgYUC8u1Uq47f6YnLWe476r8Dr_EO_2NCrdm-blcZcCqnYy4MmPHRJUSa3o5SjCDrMFuAdqNESGHGpQKMkS_TMhmpDyBn_42ly5t2fjaIlPHZZjHzYcurHVOevHcj-m0z40aTKlkPtq2BOjnO1ZsGbGmqn77z1a6QJKLwMaEu7UKkw1McYzPq0m8BhOjGL5PCCWaiTPMt-IfqWyyEVSU-rFWfV5DrBc6C2zNxnrGoVOIAPsN6t1Ok0mOyb-0M2XGBRF4MpMJkEnGD8PvW4zMnxCmeB_Cs8OXB3lN6mxjqXw53M/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Shagg Salon",
        "address": "26317 Gibraltar Rd, Flat Rock, MI 48134, USA",
        "phone": "(734) 782-8989",
        "websiteUri": "https://usmapscompany.com/business/shagg-salon-1y5qh3",
        "generativeSummary": {
            "overview": {
                "text": "Hair salon set in a Victorian home offering cuts and other services by appointment.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiMweDg4M2I0MGUxYzY0MjM0OTM6MHhjY2ZlNzIzYjIwNDMzNzAC&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 4,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpcixbFNTCJls2gUg1ygUy63Qss0L68cPFfcGO5137PaiuHjstQV2o0wqSPRUVmTpbNaD7BqY_9uG350Bag9oy5pVtbE3kjGCAH99OuliGg-tyqphKQglpkiclfrAzwdNonnz5KLBSHlhRPaIn9g5WU2QOOT9E88lIi2q5Jja0aig3YtOvG0B2XAmqG93bQ9NgSA98ecejmwx-3gc8rRMn1VvC5Mhlo0k_eLiSZA-LoK3lIIqSMCFrOSysF67o7_kBxQnxASKMCsVVCf6JaBjeYYnOzfDYDnOLmDUT_SQ-MqaXBi-mm7k-7qPkr1XPXYMyHWXwcTk_ebe8zLCxGPFJdTUCkge06MR3ShIdWTwKfQPMsY47Ks5-JPTgbjgptbyI2e0iWDV_Y1IAbGwSzQBub_ZkEm7315UoHjqArvgYG46d9d/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpdJrVtbNFfxsOMHbmAxTEI1HtI9pI5pc0BnqYtQj14bbnoIkewz-xs5kacKD8lJs4GVaMn2F8TcvV7BTfYNlrzosjfL8ib5LC2rBMJXQO_LwETcpv7D08TlFOX08zTbDA_loP9RC8NZ7SU2mxdja_9uYFz85xhEU1uT7voROTHLVxjt2jAKgSpcPcwu-ljaCX3kAVQuAG7n_DG_3oeCuZW1C3sAxFBK9wtXPKlGEYpsNh2I4NHuFZOh4-bCItbEeIAMRavGk80MNCaRlUi0I3tsvVYKIS4emdoFm0q37kMSqr3T5_mMQKyJv9nTyO-xIGfMpwX2tACil6Uy_RglAhD_2ppE2Ayf3pGvPGPb4gbea06p-ySrUOIRwruM6pl5ORRFiR3te_3uCkwbOJGEG-LN-9eWCPbzcNtjMPSgZ53lOQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpdMbHqZ4nh0t4SYb17lmQeZ77SV1fAZsM9bYQskE5bBGCLUi5ekSEYb37wmA28VaVPr-hGmr_23r-zXuQ4DqlikF_ONZbwTkYQkdGshfercwY8PEHjHuTyriSzCQ75RgGPs-Hv2Tj5wOwtvEdjH-HNdugzT2w5lvzhdGMCkOexua41eulf9DQ25uTIDAazdeeVNXojBmCqzBOpqZonPeKlZM4J71P_erh5gQ9NJctV6MQVyXDnn6KGkfKVF4C8RukgNm5BV0EI8MbdQD3f20KzWcz7k5HjCIE1YIf3taYS8zUQAsSVZtaMsm0_isv51Pz5N6o7Hf_8zmDk2gxcGySnTZquKzQXbv-KBkYBdnQKN0eSYQZI284ZaR-0jr12uwxzLGRl8YfHThMHhGCGwovDrW1QwVWKMvt4JTUdKBR6RqA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpeTvflpKgcsFcWWgTdGAKvGNlUIOi-K-YXAngh-azOhGVV5I2FBF6cXfUP6hb0LT77wyChNRQ0CYQxDnHlRchI7aqjS9WbNb0rULv8JjA0CiI7veV-KiUXR33q-BrGlAVRBE-uprqSRYinha2ehcMlCR96HUbLjtdN9aqY-bto6KAL7WNQB_CqhzST9KyRJOTjBXCU6RvR4A4f7CkOfPcicmESVHNLi3egZGe6JYNdzS8K92WusCidemmm8Y4s02RMq-8b111T1-2ayvjrswSaRP9IH3w5NNMzhzGdmN-T7rEJU9EDFgxy5sDRQBSH-mD5ZmEVgzgU4mfOrTJTgkSQydIkAYNtBQLRtC57muny43r9IZM3gFq5NPv8tvum7HoYeCI44SqKaRJgYllyzYKJDVdRVtvccolT3g28UhTd2Dw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpcejQVSTV3XDwt930Pc_OlLrtOir8PjHKDgGs_Z6CuauL8Ed5SSuIuzWlA5b-8XENNlo9012o4d2qvvygSXtks_iHAYGNTBsBL0_s1FcgsQsIQ0h3OOnlIT1VAh9vWbfM1ouc8uTjEamgRIH9Mf_uDlujzC7KdWMUomGUTUIK--ISAM6RpOxiRrDhlx-iZgwQzd47BlJKBgafr1MnLX67pAa7Sv2GBds2LsP6ePvkaNuKkIydGsSZMyU3OF0BpS0ku-YTG9uUvyjJn7ueif_PToVzQGPdgq48vkx_ZLYoJ9qaZCcGiskAHYFf8oaC-cugVbn0ay7PX67ICB38mEnxpi1M7rsbtKBEcuhjWorSX3d_p44205y3_Lcb0rGWX9qccMPEL_q8qEwTOBmMlIjlwIyLTT1go-QGswK-G0tDp4XPA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpe8ZTduQyi6OgjjkBbURRT-4Ns21sEFAKylpOGb8MVd-0sovEQfg-aXiNDmXaGfLVZvkV1UUte-nTGnylUmt8ulEgV5rJd6JDzP3Hetl7nH0J9flp4LQvuGTYTBQMkHD_b_mETKSI_iHY3zHIHnp8HF-5mxK0A5aE7ajDVGdtVPHFJEuOXE8S54Jgya6UbBcYhAFabDjzaBa-T3_kJS522RS2VMVhxWqUlzlXAVu6ag2pZvTVpjluR3N7033CKpJGUYhZmEkdXIwPkDpt67L74uN0YkBollmrCvVLe235Y2NgVU5G_UiScT4dV5SI5Q32IRkOAe5VxMLKmYkFAHZ90j-H7vGjjnCq85HNWcEIUD3qgRhwv1j4Kl6d68grVF23oNPO6jR9nBgTLV4slL6Jm6Q4KP_2kD1GKz4NRr1YsmNA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpdbCp7DxFIzr4oqnARM_bFao1RKiVLWBey_Bipr8G5qG4G3PzaR1ytA8LhArtiYHW5srrEUY6LJURVJO7UhasQesi4F3ChSo5I5iH82cOXeh565j71Hie8i5SHWco_CUpME2bwvhwTylfZYxoco7LwmfijkCTEs015fUYi2Rnstau9J6QUeobC6Dx12zkJ5mQoqkYHEoK424v1PZIEni8HFGT5gbUs4cRIhAu-Uztbu9WTWbsqEGaE1Sxbvt4yzUoff7yxboeErkB45tRqy9Y7AWyfq_-95ZLojyR5RTXbo4ULFMkEouBTQwRxJELJ8Z4AfVCymTn0S3cDsQfDXPOlUye3G3Kz4rIFCORQlmQUUH6nTzFcS1Qd_5oGy0NBRxyRLlNV3lnjjGwNAzI0UaGtaPz3Rs9VMxcrnLXRaiT_ipOI/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpfSTZLwUiID4OCHpJ2UhTxdCz0LCtVGbaAH0ts6e1iLIgtRDp59i0BRDmj2b8_UrjE9RcuCB3TlkWWWOuEFGvjsHegIWfj3AxXy9riCwv2LXYdxchSr3Tmn3FSfN6vcT90IMMj_jSU1rK2tzqFqeO7fY1H9S1irjKmN7FeDyyqfFHfkTbXPycmbtI6eCRqhup9RY9b4CrpfcG3RBAeWme-cxEI65Uh4v2UjD24VXEvH0FT6xWiqxwI7VRC5dm2v5LCyHcnnG5o15_mQamNOFKROvjpBjdWgpd849zE4_MROCzfxyJU7xAkp5wMJowIee15fnduwWntNvtNwqxM1j570WqEOlSF37-wp20XXMUOgtV6VkwNYg1mHZ4bV4r_fGZix3wYaSdiJVPCkXVLaW6a_HPyAU24F-9POpz5dT23wAA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpdxDE7LGTlJRfrc1lDeRr8--pC-4urk-CNzlXskxTn_VEOvuzLEHEFdzdOio7Ds8Bnk05C7YArYARIugrqjgIZhBj5yxXtSySQZLjVxFmAzGWJ-4pX5d4CbK2TgXBGCu_EClDT9nJAR5buUT6G0GQXuPWj1SkOYgRwi8puGnojtSPu8mH8ta5FmAY-ltj1KXTCDfyiHOUWMlI-3ZylPIJDrp9PXorbDHbsqpewqGuekOu7nZ3aAFIUzUL91kANGzbByapBxa6_tG3KUFFo81pzHtC3uxK-jUjSB3hDU_5uEsnTajzEBh72Sz7tf-bZN_9ZcCO1o0-4ZaeUeDGu6bD3s4CvfzDqWxHKnvjzz4VUiLo5p2R9WFbEmoKRiqArodIVGCzN02YAlfbPWiUbSpWTetrBWDhQ4lMisNX6jSdOWWQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJkzRCxuFAO4gRN0MgO3L-zAA/photos/ATKogpdn3xtiGXesBubidSjLF4vzqMo2Q-tuF8xRf_tuZ86uYQ0gJbq3mvi4tdfrMY_ea0pMGrMoG6f2S2WWGct5R5H-Hwh_9Z_pjEnL6yjBxNoTZUwcB3vuyMCpU3u0xSDrHiVdLRSQMoT1hoKKFnOGtJpLAnBlGB1SuynwYyXXAd5-cwqXSbE_LkBPQLiccQy0Ql9A7G2PwThCgJyxfORB1l8K8MIBRJnpaRxzc0aHGFcmq2Jtnn86aI8RV3UOD83KX0lKfRRbmPjia5yqKx7lkCx-RS7CuI0wuchYl3kmqgSqGfCTXCqnnn5GrzeiqV-PjH0GnBK8X9pa57lOHO9KHPTLdJkToKBmZxHZyu04zH_eqs3PVC0a6If_oktUJY4b1rR0iiuxzlmS4aj8BAn5LQBVtnsQ-Y_968uhTDZK3pM/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Kelly's Nails and Spa",
        "address": "25743 Telegraph Rd, Brownstown Township, MI 48134, USA",
        "phone": "(619) 436-9526",
        "websiteUri": "https://www.facebook.com/prettyhien82/",
        "generativeSummary": {
            "overview": {
                "text": "Nail salon providing a range of services, including facials, in a relaxing atmosphere.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2I0MWFiZDg1NjNhYWY6MHhhMTNjMjBkNTU4OTdlNzM1MAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 27,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpcys7mprf9AFx1h_k78Qe0chDMJWH74iY5-J1p48sgyw2G1pKoQ8WbCRYC4jFZ-X6I8XHwPWOVrqitv5GTr8PUzTxfoEgGVqnNcb97Kk7ai-9UiR83RDoLi6TaOou8p3zmRD-jtsLUmRGtraW4kepTx1sqYNERLE69vL0FACIhDbyICoBRycXkdtIl-J5-1d_0LJlCpCg7W2pFNPWtRVSCWhTXMYPPcXGx6ZnLzAUNsZNOzeha97tQxg4IcKirjzfAlws4RieJQhF_sohr-C3RE9owh7YGQ1xiNBGsT26kXUw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpdRr0RZD9ZiEBLVtPZQyhuNrVK6BIGEYxRZ_RCRw7z73OLzMe3YC7BNGJ9qtGHd0yk-Zkq0kf8T3Yv4DwkwHGXHjSx34PNDJG22Qe03xy5AKY_QmwlAUYnslxsQqVza3uGEBxRaAfyxCDyZnOzudZ07Ms0bbBZcTdaIUWct8YaDwhRdPjfMCXrp7DqpArDMhpRvSjoVUKOR6vFnUX3ugaSTMrF8IMVCLRYj9cMvrF2paemn9Vy-qeRAq6h2EJqXBYZOc5t5aHtLDiHCsftJKCekOwTxW1DWZwNWqY1CZsuA8A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpdErSGUMtllx2Ok3pkQG0XyfFzv14d8cdoNvHSYlv2tbGTZ0RN6KH9YcSA-4gJxiSdPC45Nl5qQGmkAG1RPzIXlBXG0Dx-Nn8sFoy8xtLw9-YepoO062cp-gGxij1gs_MZO932fY3XlotDaocCI9Y9Bix59vCTSG5cd4yh-4rp4akGSIBO_P6Jbq_9tSetRaO9_7QuR6n9_Mwdw_537NNs-u4X9ID8QaZT6wun8xWkHyAMGBQ9dVPfcqmR8yQ_itxat9AbjQXxNSdO9JY1WzDqUrGdAZcfn0UM2ayIc78WX8g/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpewhqi8qjIAk-DXrRYtY4Yxgzs-D_ML4vuTeIqzBMFSvomYIiGzm-lC6gluyrmYGSAHVVBd5qMhR-nssS_MpzPF3EpEDkcHQdTo8XDWl7Yw31MCdIakJXtFaqPyajDWCM-aNC8yOsC_tVYx1SU-iad4aUCop2Bd6cjJswtCollMGO5ov62_itKKyGEBQ_a4AG78VLX3wCZVQLXv66wBruoiE0ZY6C3-x7XjemcR1in9HrjOeGRzn2snwVU1OZ8Pu1Ej2RfKzagQuLTcpu9d90Ih1YbfIQqErVubhnkPRFk3mA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpe2WYqHLYDWFbah_z1mK686O6xtkzGpcNKLGEQ8wTJ-YZAAWa7URguECaBxx5neUzm4NXMMSMGscE52i_nSBKGEXOGR3y0T5d-BjAXj73yA2v--O3Ns6NwR-CTKb9mwjCDkny9mH52aC02Vp3fOrLolCtPcr8KrYiDvlnAbl1Mdvlui59vBFbbLdbwELEdE2DO9d78Ok73ANzl0v_mWwKm9KNuCdyYFeEoryK84W4EbnTbdICauuEDo8BSPnJ7fjbzuctwKNxCWZuBs59woKzPF_x_d-v_r73SR3WmjrKw6kw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpdZTx_HfcZa936QRi_Mhj2OxlpxGkgDhsrdrIl1sNK-vkHFxhs14Ng1wXGgslrC4Uf0I9sqp9JWkdgObcBlFh8CxRGqKy7X1cZ6nQHbozEhQv43dL9sTcdJsk4tYUkqe3nefu-bSYf_0TC-wC9ZXJpTb8T7UnSrfr9hO97fxChcTMWTRTPRPsZQvxaIcCGWCdJQBgmgxp6N7bBw-ggozs6TVYNWWN4LrdiTXyvMJ8HKiifVhkxPhjHGOoNd5WJPJc4uXC0-NmA7rkP3AHyrgWncubdruXLUnXxtZwEMwuuifA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpeFK9sRE4ZQq2a7SDh4YXXV2gOlkIraqeO0wH2v7EeJAwyN42tZqnIPvQYwDMR6Q_wHDuh5bOpA3pgNtPAzKLrf4ZSNoLZNFd3b4vcrKa4RRkn4bHBmyGH6oWhn8jPn9j6r8LyTxbPiqxnyafFn---jD7PISS5vpTNxlaHJ94MjYYprbGSw55PW8UkukHuVdGwK0rPLWF5FQiUaQsA0Z-fhPTFZCCpHAE5C9fH_n1AE5yIZOpoPYBlpRMYaM1bR1fU6fnVLQnjqYaYo-eRfe0MOlwRslzgrZ6AqIK5uf5Eq_A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpco92iRe1wSdOZv2n5iinMQhIjAGmD32QVo8ARHn7bO4r41JYgTD-HJmY_Rer0LE1IEjb4LC4_sHtltT4WnAuYrs-LNWxRX0Hm1pwf_RWwN0mrxnkq1KchFvhG43PizlJIyHWSBsyryHOtpV6YUN_ktS3ll9FnH3n-8fo290vcL51rAONALgm8vng3N7iRxCBbjPpIzGgnN6qJ18sa6n765VX58zg80hXe88DgIHRP9OY11N3r507FZp2-oQYdXwiUSQjGign-77-AgLKSs4E1zE_PvppdtgYodlxwV-Kqq8g/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpcIDuSoi02m4CYpii6JnOCkqkwwnR7RKGIkQUfQDQxvpYm3fyAuE-AgGj_bot1BK6_C1ODnHWmnZT5mjkx57Dz5e7X_0zJMjEE7pElU6mKiJO7ZCwkduLjQU39v51b-O5bQQJyrIaB-Tv3lTWXlfqdMrufpDhWVzRVreff7LnlnqB9h0Xd2tzw7oglolJgOr35IbUbqM5pu_iWt5TfDonBBqNZySvPbesh1HsuqcaCn9czEBn-u2qVl88bSxgq9d7wUoK_9z07Jy1l7Vqz91I1m2lcrQ1tx0dKK9Uvrk5LyFw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJrzpW2KtBO4gRNeeXWNUgPKE/photos/ATKogpcLaaSn3w0kAEdOvEjPGeQUMqtK-rbDnMfrHqLGCwMILdLrJBzwglkYixHrBqenfbjVhJ116BtJX5wFG0jcsROroMwnWq0lazpZ-RH8eWVuVnbnR-6M9gqygOItHbCKejRUDyCv0e6ftghMvYj8wsPCcXROCmYML7aq59PEeEmlHdegAmkTEsvrbFSACfbNryE1QZpT2KwqvIepfoxYqyfa4oA4PAyCwkoCAijDisV8ccw8VAoKQOeIFxXd7Ot5nCUoYDKcOtED99SQyAsZiojccAAUx4O2bdbC6vAhqI1Y3w/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "My Salon Inc",
        "address": "26080 Huron River Dr, Flat Rock, MI 48134, USA",
        "phone": "(734) 789-9950",
        "websiteUri": "http://www.mysaloninc.com/",
        "status": "New",
        "score": 1,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpcM58Ng62Kaa6BQIPxUkgkPjx4ZtU6iYnJiPhDvPy4lFtB4hkJC8hfYRcgeCuLuqJlsmq5OwFwv4JjKN9Tiju9Bd0844BZTEN2C6TE1eCMHULl-NqgBZNXFewrJQ-VNWLEi4QCTAIpP1okKup5lkkUaYaGlXkLI2e9mR9C6fb8GiCmuwIFsAWRiEHTcGGAZ0SN7-RjU_xUGoP1-fz2d2zO13qCrSLd1TnDNLfQKKuZw7i2AOHBrP0sWy4TnSBNdP25-WhKhmmfrVn826cq346lZm6gbKUzxCeOLCvCaBK9OC5AoFEgDblKo6mot6l_VPozaE188KGjs_tx3LArhTIfEl_rm-jmvxFKSmP5FsdNHuE33fBiPEX7ClHQE44ZYRutd4v94RkL0lJDYbdA5s7kSsB7vCSTrpKPizJjgJsTIueql/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpcqSeWm_N6sTQ_1ZIPcOSBvSsgwQzIw87v1m3ffDk1u6M2Ccr4X48ixDAJNPCrGWaOUnMOvAcEX322NrxtV7ydVBgCdzZsiFzApyfi4Rsz2GkmpaLoPQqI3NloWDe-MM5WFPQy7VRb5gyb_wOYAWBQKE_jMQ_rtnptSYew5gV17P0AoGyQcDLNB6ApVYQgNQ4msSrOkPYzVwyamW0yeUqJpIv90sQ3aOM_6pPdqlfkUrW9kDgKEklSmYc6IftfQLkpdZNPovR4knlC2XzBi9KoW2-l0-IShZ9vMmZ0SepKiTGPjpB4nDuuTAG3VI7RSGIQ1b5LBwkF2Nnl7SXg-NBAJqWH6f6Hh9fd25esvwM9BOEeeMDY1g6IaZShWJ-rRp-SQYnCP2fkBFIUhqA7eiBr6ZxlvjNHp3GKxUC4-hpMZrxQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpdjm6qZhBY9zHpiPU_4Sy7vpbxphHQvSgzrh5QhotL_pjEXrjXA3l2gZMSWlptIVfP6Y5r63_chWtHeYApjZjaxoK8ATLW0mljaLlxz2UiDyaT0D9OXom0aIpnkITE2V-X_VhIWe-sOWpdeefHM2O-TNCe1XxjlKEiSAWAbxtQyBeNLWViG1op5G74VnfcBAmZ10_09NmgYrfx2HZPKLLIK9dYPjTp8yZSg7I9hNUlex-uJ8yhdQ9bgYAYYzyU_BKCEH-UepbL1bzaOr2jN5kGMxKnXiE7jPrqSvwYpdvW4VURTxdDQe1QgFbfpcFGoUGdB0BBHSp5CwP7BqbMJmJUpLX8-WCIwM1_pDVCZxycBf3W5HHWwDgLEBiomgTdbm7wv_HdHQf3PBhGbJINx0nFxUWzmG7zo3ea3uXzMkRl6iA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpeeUuZo_tpF8T2CdKYn31I-T9OfgT_kLM9lCUcziK1rYrn6XddEDjliE_RtBcvkDGF9T3lW6xCq2JdflHItSZNoiUKXF1p6VO_N6uY-pOKBwdxIFTx1U7HWTNOgUT5s01q34laEDcCN8i4cLUuQvfbRzUX19fwMpCPDj28jkSB3BomJH-igSk1czsHgIA_xPAzIZrJINHOPO-cGQ8Fmycd4bQjQk-Wv-nW5qZD7zZjUYY1YPptKYPBuSncj_MZf1CLZ_nVNOu4Dm6-UiEZwHr4prDrWqD8yoRBOOP4Z9d2nRsj8rrzPxOOSb88oSqN8pCxLslDvoY83TU6xFLVvYjWXU3i7F3VmVro6gA41iYIw85_ldeATbv5-dEjI3XsEU2dZXCV0SeEI553zIfoxhUInUfqpqB7y1dpn5gAoggxxvPLZ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpdTpIPEj3RzCGtnAZzDSI6g_qjWbFLqrTUXnIosM_u1NJa9UQqZEexxW4UNa39_-drtoSrRzzme-kVVl965mOXyd5YNRllGeCfchwYfG-Qf1PkJZPZhMKyxGJo3sY_6eZ7IydLDxe3dSQpfL7j5REdIsMNGgZEFLjuYw1mgmSElaoj3Tbprmi0NylErMgrelOpoQKEtHKiYm5atsm03037asEAv5ojRRtB5UganO09CuwQ6g0TktKwe4N9soLZ2gpk6bf0bsRliPmcPRupvfev-nRTQS-7Td8HY6Abr1RczH3OA7jwQsUrpMnaMsv664mJ_P3av-ObC9wxUYEZ-JPTRs5UDhToFqsbfPsLbFI635PRHymr4fBnDHclGMTfiRyiQ1ZW5pzpagkgjJwlyDQVOrAdxUuaLRF1mpk36KEOGQg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpeQ5kHPCeEBN6oqnFodyLuXxtIMmKYKUcYkXyGMgNAOERAMGUJYZxNMunCOdDjcfbJ6G-YhfBGA31T3USob7rUVqEaPuu3bvJee4INX_C2VTM-tgo6ffrVoGE_xipnkYgTY-4EEbdraTwrIW_fXKc25I6CzN9XiwC8aCy4LepL7jq_CuaP4A-ufN90kZvuYiVd3fgM_XOm3YdESdDaisykvLkmD4yB9OknbGk4KjVAoaYp_FNpPgLrqkwNObh5128eGoYcpAyHPaBgrgg98b5RA4qF5H4oeujL6cxH2t5usdlwGsBDaDdQ9ZHIJazsYSwb9krcXFgqXWO7N4FzCgbvhOQuv_4MGntrg5FVi39gvAHqIDcTJJsgcbYjScrGsWVEULJMdjDq9ALN6rJwJu3lVvVC2lAsQAFeSytQfbqN_5A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpe1efHcPD-tbw3smYVmmdBkCW6-a--8uENXpoDYWt7-ZMTQzMKBCP1nRTvsns5ZiJyV5u_KmBd3i1SWr3Z3jpjvn3Ryu18g9P_aigsDEGAN0k-MRD9xxqjvapE_-lYNVuHLndpXK9BoWMAXaYcxt3xuEY6re7x8eJsd3SWHb3igYyvN8VZzyS5HiQgGPIscy3jSZBNlNPPZuU49iZSQyMxBSEgc1KXYM8vx3BdiMDLGqlU2V9fdrpPQXDU_7yTFrcCeQekr0_uVjgeyncNres1ZvBBjGRAFQiuwJ5W1z7C0QPeJZUcbBkg5m6kmIuohppb6sgOK5QRq1gT8kxFuhrOZguU7uSwyfFOCIDUnmiP-vuhzniKTqudTDWmqSuZLRR2nrUce5oNpVH8nBpOccfrYq70_D9LUyCvYsY69bl6dzSOs/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpco4jYl10D0XIlPif9Ea_qdr4iejcZfPVp9ZXKgZah-I_Tl9pvawlStqQ5Etlj6sxHjr5V7EBAB_g6FscVFI3gevshk1ln67YF4oNSczB_vj30bGRf-XWqDm5Lz1iUJfSlu8p7xWW8Tg5gd6ewf6fZIdqbY6edYFp-ORz3f5fmIB6roGpDPo9YsZDAUet78_HloPItIEbIxDTYvahViUL0d71syI4aLYxf5l5EzTPiav1HnFXWIQe402d-dnC3d8cm1REW1eE6-pfo-Z6GBhdrVvPs68MdEC80wcNIepMdd69zgqYe9Cf-b_OEX1Mbl9HcLVSk94ErP-lA7P_r0WzeG9tMWboTBSLa6Ps1UGuh5-UsbS1Fx1i6z-tWta1rJGE55LctajbulD_kG-bcegu-6tFWmB2dUaXpbWrtlgIhWpFyy/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpdtgR9KLeNYn4qfSOaFHjxZ_Dnm7h8fDVzQdZUNrzVusUGZB2-j4240en-1OPwGk3NnJD56grzmRlI1QrAhG31_xtXifHB0_rmY07mq-gMrTngU73svvxy1SmAnB1UElodIswwcWtwSmZ4b5I27awEiiOk1tTm2Y_17S6yvj90U0_BJJJkNlrkcRDz-Smq0KbbPisM88JVfhM6MWLHP_6h9zydVSEXrysacidC7GQfJoLR8iGO5mc5Qcb9OR9NPHP9Udo6-nejmj0b4g03PX8w5_82kDnLArZWT8TCiZk91MFQS2mET-N26vwlfok4Upc0DKZ4cv8KG3FYAexu__TuVjrJGsb4gpwUBMlZZtu2wSGFPQ2-y_Ez27Ah9UjUPr_CPdo829C75yPdqR3x8WEzrJESN1d0r6PNF-EsbMuxzQe01/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJQdEsZtBAO4gRMjhUZGCRUqk/photos/ATKogpcPyJ4TJP1xAM0QPCzGbPTZGM6C0c2nCQc59vF9TQybtKvP0SKezO3ZY0Pez8pFsiaT1mMauU6AEaLHmjZ0TPyGgQimjsL1sdeMDRfQE1BDr96W-0mIupkW4SFS0X7giHj59TGKBszbSHos6ItmkUT6_UgmKj402HTbTIftyoY4x636mw8r7NGD7V1eAn4Hgr7tiPkFX_821h3ZxV3La8evLTSiOeH3H0uEXb0EM3Yzo3vqjhh-jX0NY7iJIgefiSwn5yPbp5qtcdd8wpXEuMVZP0F1HeAhs-L2qIpwNDXfk7goaslOio5_ksX9BGYm2a2wNQ9vnD9JZxJzitFSW7Hi8IlcRzBfzuzcmgMWX7_Tu1KbG_yWREnn9WBGBwTzVdfKhAZbt5OxGF-V82PjOXsqYF6vdJvmouCzLp8jU3PFJ7rV/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Diamond Spa & Nails",
        "address": "26962 Telegraph Rd, Flat Rock, MI 48134, USA",
        "phone": "(734) 789-7034",
        "websiteUri": "https://diamondspanailsflatrock.com/",
        "status": "New",
        "score": 22,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpcRgQEzXoCIrTfx6DnKX5IZaxDm2v2lhAHtrnSVmqOtZTspZgZldmk50zizZ1ejDJZKoNw1mrl47XS4H26NahSbA3oJrInPzwiFYVw0dQUM1t8hv8VHJY-xj_Fz5ldYffd4_K3gIKqKvW3255yqkhopuxDRqPPz4J1WtHkVCjKqN7r0m-9dqUymaLy803RVVU54nCp8wmkztb3KawNmLGHAp3oxuLZ9UcwjL9QAlLgs2gpkOUA3914IhbXpCcGlCvlMVeQkjbwfKuUN2OVOx38CVnW1yb7VA8U-Vks0rdQOAA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpevdbp32io2vQHznXZ_GbaHUkLMtkT9vg7nb2CmiPsI1a4BjhAvohw_igPmlumIhlpcHfBqjLgUuqWkdnsSkHjAYa-pQE9b1I0cmjEwCSdyo8EYpCt21vDcMYbRqZAmYV42IJHshUW0Hplf8MHKXCcxVsBEPVG4tjUlYafYjqTfhYpuax2oPz0d8WRxcYztmdhzpnXydSkmiqyUUYl1z1yKuBJHMq4BOBxfrPWxmqE4KHZ_HvkBj3KLCavVl9Go0W93MWcoEqKLZlDdO5pHdfGOMi9aEJGD4j7KrgkbGAFVHA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpeCobznnlqBCF1THDQYypjjI_gHpjGgocDqvWbNTD57UtAoHCUI14CU2g7KCkF1HFkI77F_O6BXV29Tf5xehfREHJakh2aBiYVRCfsoLJSeC5QBsvfsYKRSfoAFU28I8I8IS0utf8-4muUnmURYawC72X7SWcU1iXGwau5I-6pdup1OJhf0vma3C3UrcnAJJShCYh-HcWaAY4nD4_aOkiQ9MCia_KDqDpygTpk2PYsUHHCU6uBySXPOMU6e1rzciM-egy72nuxHNl8nATOP8PCS4pq3ZFKq1UL-OPUdnQzAhw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpc1-m2meDfVX_PguPgKJ_ttlzcKHnSAdNwGFep-hOoMLK1-FJBULiU44l1-7wWaIlMgYGGNQX0rvellMycMRMybWQw-ZdCijzPcI2X-RuIFIJyDTVfh_HC4dpxUJ12Wr4Pd916ow_w2JymWQIinctAnnC9M4v5CrlffFXstS-vbEJF0v-8qdpWmcd9dBIMFbY6WHYInaqr--mZJrM49SnNJbI6NNXXXW_beLIn-LOO2TAwB0FvX8XoJ0Xtn6CUzy59XHzljP2niH5wBF3r6nlT-_veDyj9F9Rgay8cFXKlNNg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpdRKvzHbII8xSVEUv5WM7BmtjyXkAPFYRtaY5MJzHnRjcefpnrbNOFLW8XpEGJaEzBD13Ttq3a_XfWksVkAwQ8WsRpw4cJ2q51pDYAj8woVQhiSyG7klqGORkZVVgoAuZDorPPiOhgfF76-LTn8ZgNhT_MVr5-bpeyJrBlELyrUUIbXGbYdxmb5rnAHg1IjRxJjT0t2fqrpRFLiUx8-CORFx1kJ7Vwe1djL_xClEtZKPsu40Kom9M1kecIIT1oD5uw7dJFickPZlxB2quGXcqny6A5wSDu5mG3vbovunULy6A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpd9UT8_5eSzj5z8F-XQ0sGlopEUfSjETXEq1F_TpU54mKrCmZEBkuAtdA8fxmSR6Z_rAxo9I62XK7_wNNx9FNTUqi3g9HMBt39JYz6HiXHRKF96rTohwjKy5rfraE4Z9yG3bfGPdjpjRilkNORmO43HKV2-Yfe9N15EzrO6AB5yShZw7nkcdxqMF5NhgHFwCyTNIeozIWG16_NxsRUUj22Dthon9m6ATAstZcM751x4E7m6bkCwUa_vVWQonWC9ILQrBfgcqCxLkYsgegZrQ3RKNtvRvMkBjMvugw0m9F5NpA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpdRAY_bMJ_jMGFUlTqe4KIioauP28jMKKolXGguvCSBiQmlsjldjF3LZ6NXothTWatKZ1Gk25iMtTdceQoP-6LnydgfwPE2t3vZ65sqkACXcZDzkjj9QNcK_UfuwHRv2U5pelQBwQEzJGL-djOC3gncNQt1xBu5YwLr5QkLPu7TYbpoKr_vBxC0JUX0KbJMv23H0_NwZk5It_KQ1RpCQFtofPin0tajfnGj4PEP6n1qEgrntWJiJ2xSHGrki8cAP0sKo9_HHv9x-bzdlkr0RVfbwf7hFIyS0Y07ykgEfRoGeQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpevfxMLh4AvhqegTzjOUW1OCRlujvJOPGDakib9k_L7L8TV5L65Ad9s5IJcLJNYdR1J0mZGbBRJug1IZnOTRjgN7QrJ77tvP9qU23Oo5WF8Z957ru_hK2zP35WHDN4j3E4l9Iquki0q1TLPFSzBj9EbExMJV3LVPc0i5ygTC6L1rFGy35iRcf_gOqK-V8vmDd0jgUaktAc1EHMoi3LcYJKTVXemeimsKLRnudQ-hljkMuaXWfx_zwaKtaGnEeNIVl4Pomn_iokxDG5ACYOTpg-awT360_i5MB1tCXSQ_SBdatgR5u1GwDDnjF-iaKeL3_dZ88UCiySW_sd90SeJ9X8a03ciU--GwjX1-7mQrqD-Y1pLk5edBektKCPGJCrjhaJdgD-xtqKeIbgEztsYl1ZwjmE5tcUbSAVGbYvwmN16PA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpcVtveqXACxCwnCboKujwnOR3Zy9Emtkkn6fIGqS42wgx-5t-MexbwJJ3Of9g_5IHBI-mX_KtCIZvjHiYCvqrQU-0dtOgpZ-RpOoVLtxflrLlM0Nl0gWOy7hWYkN2vTkrdBV_y1yNlqKxbY0wCHB5aB7r3qpZWOLcSgqK-RCDQhkNgHBdvLKQLk5lLC1F16iMRmbTNb2tDBuVrRmEWw46L78GGP3v2kRoAKs6c_ZZhm5xFPNbl19zBIA2S2-JBcTWYCLgseDrNCGIQFLomBu8prsyvA2ZXKC18kG4YEtHgmKQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJowN9ZwpBO4gRpSlztZTFhko/photos/ATKogpeSLrwzN3iLiDX_9plhWoPDdgisSYTTIIt1MXgwO5hNjkQBNLvAvqs3MaFgsVUrg9cNrwKlmcPFKiPOhUM0IrjC1nLBmh4mClMB9fuuECSW--XIjlstDIMhO6i4KrO6gASc9AJoi00HXdlvWZsKMMnn7RNZTC9yTKYabq6UW8suR331sAiUHKGw5jjA2zEgzuef6f222GnudVHWtajg-dC-ulTwpN0srWgdA8-msBP7ZKWLJmQ07ukhX1jdV5PLy-Q0WGDJYi8ydt8IsZNaauXrOQMvw70JUDgtTMWAmgkrnw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "DL Nails & Spa",
        "address": "24641 Gibraltar Rd, Flat Rock, MI 48134, USA",
        "phone": "(734) 493-7151",
        "websiteUri": "https://dlnailflatrock.com/",
        "status": "New",
        "score": 27,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpfKGNkvhwmbP0Ws6pIfKMqf2AfapLrsA7lHFHRWGSD28PkI3_9i2vtlC_B13bgLpyyuScP6_mvxwHs7XC6YQHQlc_dTzhcoG6k06xSgKJDbq752zhA0zeIcMTh3dUN_6pzxa3fqVx-CIw9A5mjM5R_4Al1Z9aO3Jy9MHORyOyoQNM-0m-KSNV0UcoKPCHKHnUrncDCdDue5cTAXLGv_o48Fl04UmNhjoawnsrvWNTLXYBgphryngfjTUn9qIMg5M0cdBDItULXoBFTAYFwJ00hdPx0DVVcvXi6tyI5G0TXayA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpdMp4r0dDfLGrYYBX9O9HMJPdDhaRAJrQCd4LA0ogipe9b65AOZGS7Pi1QzWZwDpwFQEbypD_H9_Axwh3qRLoFmn0nz5NvnWuwWVaY6L7IF-MSoA79sXPN8qa9eSh3HTo8HyGQ185JfHSAl7V5g88uYiLXQyml1zQ-QrHC5K167IgULe_55VT2ytyFRogw_uBsVExc6zB-DlPnqcQiPFnUBUvRI1cRB8dhDTYuVW640TbVOO5hrTqQyadRLen1bxJX7fIVSDsD8puB2u3jlHUnPZbfIRdZraaumNGQHt1M658xLL6A-7njqZv0NAyUcAVNMbcjVl45OKfNq8SUwJXyv1-BkydoNSt_SI_AETAKVg5GFeHcrVeaA6hp6eGpR9cPcEGuaNHL05_R5ebMWpkgWBNFtNe0y1WGu4TkWuHa312kp/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpenyx3wP666YzrcO-IntCrfXmTd2xDD8zDUF4ke96ReRs6_G-XPZVz2Wuc_ApHXuY8JA1x9nEdteqyxPBpAveQ6SKnIjzsrUvDUv9YIVXWtiR2pD0ksrDnTauZld-JoAdb6twuQrWAWkFVJDmdqE-svYhWFC-eI7mm-43glaqM3Gz1rPcZvDo901yivbT4CZa_N-jq3bw18L4lLsJObHF8-Sy-9PhksaKJEKd9f1FteCPm-TBjJPvgwcEOkG-n2ATVxs2Wmu4_XH83Df_N0342FAVC6GEWIoQOgWa9M6TaRBA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpdW83oxYkoKNem4U7HxGuDy4ZaFRGeGomXtQKNn_301j3eTlLhH4v6HvCm6r1rK9HTCNAubnFKRMWTw9BeoBJzkR6PKNQQ06veZRhaONiB49_n9uQgQDotTGjJKfh_T1FkHLdl42Diwj6jXQjy0yJ_7z7pfYpFFNycWL7rSQxfuUVZNuFgzQSjUasnNe9voZcKb6TmvGc26Izgl7XJtAqnhELCNfOF_KF9S3HQEkCDWB2gNaEZJfs9AiKrSSShLddYPLhZ82gzCc5jApdwvl6Qlpn9a_3beGYczO2ftF-SFFw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpfIqe7_QfpcTd-7eCqBPdWWrP70_nzNiE-k629qO-cTmm7u3iaQWq49IfJYqlLec5bvZqsHKnAb8v1b-mgdTJYnPVmhwJXMqNLVPLF4hmAdn_yGdFYb0VpPG8snMOqnMSfZOq3-LY2rhRQbj7x-8cyIlW945od0VNIhnDlM1yrio6emAMtpFg5eYcRGJH_8aULNEmfrtJEQUySl6mXJeQuRHmhohOpJU1PyYQlqgRD-d2eU64js_Bw8HqgR6nhLUZWJS539wGfHk-nbuh4tQ0zHdDGSWnhY0xPxnmHTc-DAgi8ivByVcG87k04-KFn5Rl-rwFkwmlrbEomBgL_2DrT4jRTtLdZZx1UmXy6B8R4Fm624kUWlCxKUHpCLMh17W6Vdh6KHi-akJDCrF0VsGSNq-FWvPAeWIS7jwEUtohiRufav41-Tgep_YrHgeg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpfwGiohgRHJHm0jZ_uFMt96yckCO9MQik53ChsZTF7EuE2xRRwVtY_cmzGwMb4EsUcSAJJvgSJB-Ft-oipdlBQS-6j7uNsT3Qf1B19t0NJ5OJ7Znu1aBalke6ES3x3dg-5A5Tb3kZ69e6u5IUll3LTWxVLSvrOuY87730fHzBeY_VTG8VyJwfnDFR3bgJQJJ9ebQOLc2Sw-w6oJRGTLccVJLWg6yAb2cc6fhxJM0kwNrBxpSiifxuWiMvPMLL-npSDn-Yl16shZssOQOPDcl3CW7f7J8TT-ivhhZAROM9XEnQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpfxRsORi3dFcw_H0kZBN9IcOI8QPD_MZ9cAqvBl-QkMlUQXnYMcjIKFsAAE2X02lDbKn7wdnpo9k9x15rUVKXJwGEaumaXf7_NewlSl1pFLptR26dNQ3U63EfObFgd4DF_Gq005LTC0zppHFOlQkNGcD7uXcEJx6P_MqrmBom82JLtuw4gm2_k1CQXJwm2omPhwNm_mG9T7mrW8kF-W0fUL8Eg1GcFkeu0Ybqt_3C08Q7iqHrwqdHLr2lT2DUNjq2vAmBGa1EF4wiCgFO1xuzUHnSVtSLsnRx-rKnGrWVAbXA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpehtxe_jiGjj_XY9ecvuqFnb_RhptZiRR_qrX1dA8FmYuOydtNn1-FvjFm2M2iyJnd35ZV-NhxMsKFNeRfjE0sA6oCQT2b1NritVzpQ1s8TZjO6wD3jJZfdTmy4-UFzwmMD6yeTOwIoj7YH7n1ZRCiJdkPfXwe_f1rDl2dFAy-mmnl89MvDlL24dfgvlM9BGm49HLb18aOPQKbZJqbSDfQo_nM1eYFtmQimGE0unzCRnqaexXS2iIgS1F419Eqx3xQFLu2Z00gWM7t8XKDnsqbxNLOPcKHEnDnRlmsjLka_A30TVgfKosJccRj84vPfbzmsYPRxa1877rpvO2TVO5sqEP57z3Ywbro1d_J5LwXV3I3-RuB9uIaW7WGRJZPSHW6EQZDmlMiY5NUxWwEL6Ijm3X7rbLe09nKwywcDqT31Bf2nMxNz_OQQpg1-Ww/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpe80-jBad8MOE6Eemv9icNNKWRcaVR3pnd7v-dloIKmy_nqClBL0GYRBJRNKc3_oFM0VaDnVxnV5KqSJj1-FtxZCCTt8FPYy0dl1SB5gEFdsWdgUV-au4hfjD2P8Zf96NWSW-SPcR5k_YiDiSxxcZGKQt3zN6M6Yt-dJ4WLSwFASn_aeQAy9g5BLqa3Zrsx0GCFW9G8S7LHzC6t3AaJoOc9UBovrsNWUDdfwcxLs8jGWnJI7mA4RUvPCbqW9R7WrERzwf5ZNJxuyKqfLhCgEBna7uRrmtOavmfsarziCp8c0ASF_EHK7gFVXOWOBKKGwDUKxF61O8m6QYZPSz1Cg80Giy4Kg_rUHZdqSugKmJrCdwF6xPTvE23zBnNV-ZGN0NsYTlpuDwS6EmewP7e1DEun4HK94JPCs_WKm4ymbdSM-pCl/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJDVNnRABBO4gRT1PdRqFZSP4/photos/ATKogpefZfYCGa0den3N5zCztdhoI4qB8Ntomr7YJgYPeTgqCwkVrr3Z3fk9i1s-7HPEp6ZgXxrBqq-gQSUlFJoAzRZYtqISqVyqv_riC-Q9iys0VDD8JfoLWnV3nCBJiU2kUdCu0jwcAYCLs1iKpd8214mkm2L-WCtElL6Gr3gj26TZsTpmiUWCBnkdMUFIQt5uMPYwQlGAHRrOCeud4g_iYrombEIiji5kOslT0c4JGkew807oIkK_Gf5sqExCmjclKPNdaTuoeb-r1owFcmJLobK9y-qk7BpnSZa2gUocWYIQoKUb0StqgOBkFklMcyH6BSeoD98eUHJAfLnYL9gSlAihqxIA4Cnu7C4_uRWysQ4HeA8cvkrfD-KLlXqtBfrx14z44kZZ9M-EifTAbW-9HfsH3L-XpkTX1dbO9Gn9xggH9RPu/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Diamond Spa & Nails",
        "address": "26962 Telegraph Rd, Flat Rock, MI 48134, USA",
        "phone": "(734) 789-7034",
        "websiteUri": "https://diamondspanailsflatrock.com/",
        "status": "New",
        "score": 9,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpc0iyLv72znXvZaIdXCd2U1jjRkhsBPT8iuaCd6oWktywzxLTqW25vdSz4kPbAA8f2LduI6UvcYkITZZKptEo74JVnsN9OcgVX7cZUNuUK4-mc6vMp6R5dWvdZxGIamDfPdIWhZ4A08LpHWfvWMQGwGYdoRkr4ShkaZxLaiS5SNopcARLso71wBMdTxT08WBTGxramxh6xxeBBXcWCdxYXhPf8oIocu_A_CZk-qeaknhbizucsSh-DLLe9DAaFjMv21ysRRCCLvoY3XKRFO8P6IcUffMVI5wBCjGNi5vEduaA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpe7NHMoRgWnHhlHbhgvFfM3OWiLBy1Uo69hrQ66mCADjmImFjN9MPapz_EbiNPtv533qjcaNTLNcKKIuOnTx8jY2PKk1y9VNmph2EtVoO_pHVQocvUnWxeDgcceLUkNGpZ9i9Rvp4YJOHm1ZAQi74s4dCWZwxsHhqwEUPjsqssIW_7AGyc6Q7JEqjYnmhrBfRKMpzT3pTWqKie4gtKu2VQcFp4kcVwKcGvkNzBhqw9IU4KOBdtAlXTqYLJqthC7s_gXuwBFylmyA6ddGRAZm9Sin0mJPk_giieUxN-1HHtxjjPNiXM3vFDbUccQ3FLX4_F_CyEhUmB5e5K0qNrK2uCpkMA-Bp4IoS3EV6ofWPodsOivU2Z5nrU66eDPvAlDGAEEuqYOO2TigQRgu_ze8xXWCr1TVcAjqs1afB3swfTRuVNcmvNtqNSwnvuZu3Cc/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpdGT5w6m1tS8gmhOTWRc_tCOyUm70EMwIIWY580TY9DeBDr3FCUSGFQTHqGkQCKH0wH8tHpcD39KwpRrU7GMJtXideMdukuhoEzinGvJcfLnaB4YIrocYIgthPtA_fGOOp3pUnNsIe_qp8lSZwFIjoPPK9mZuUI7U2qvwErWzpZYn2aYmArDuNLNCkU0-n7-vTBHyytVZ6GZQcaFTItzuwWZVteJxH6hY6NcPP4oIQ54SUMQMkcKsyeiHMwKzzj3b2-W3ITsYWAZ9t2Ne5Sf6x4Udqxr7eVlwJUX0Ybams45IWLInVZLJCYSJZx1c3OTey2pHTtElCDggpZWFo9cAkcZSt-82CF2e_kk2KJtdm33ZbZe2jPSPUdBOYbZ4OXYg9JbtPfwDiYka6YOX3oVvop5GP9MWdX1063J9edz5EC-3HsFU1u59EJTITo6JRa/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpeaqw0AUUY3VvvXPeWvv_e713ptBLXxKnwPHZY63TYqkVC6ibBTZjR9JvZhnyHd_UUidCm267nAr2TTvQkYS8OQyVNElAt4duIIo2N-8WUWf3B5UO2-aiam2D4T2yZG32nLxv0KLUmyTjJtg29VByAosy3Yfc3pHFHD_kjBCH6Fxfi7NhJPGSdT4zPW1ForSLvZC0IQb_CfVPf0pVLX4R3tq7wGDCxJ_WNJciyeqrvn5-nz9QTD21BvbFUtItKd-JjvONTsc8gdY1FC6j0rCPQvEiUy2LbgBmDIxY9N2PXgBw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpecWxxNnvsZnKkOe6H2ORP21NVrpbp0iQO0wNd05EApY7gk10pKpBj8aw0wzUS301kArzM2fOG4PwyaDaCAvjgi71FrdS8QpCFjUqCev1Kg05xRM43IyzSVRbWrx_pzR8yqWpNmumJmbroRHXyMaNpLTsdqgqIUErGi01jwg3fmCsnIe4cVOQOVPJU4ZYjNMYvqlkmerAojIZceqGJxRBCXGhkYu_LCxr_TUzLs4qSPV8xqUH5nmPb1vXTS7UuDp9Mx4S9u17QFTpvJl885PwdTderS0rWdyiymsEP6POs86MpR40mNeyPstuGbuh53OCXFmjd-vsD9nb_n9Gy0i0TSMlYun7l8ZVtpS0UlK27hDe_IZsnc98JWCas48Aw0ellJJXne4tVkt9L19K3IxLf0ifKnNn1TBE8XCa5oSZBf5G8QiZycmlZW9f7f6dpf/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpfOJEqX3Sdze2bi1cZOI6mgzQsq9W0QNI1MU5a-3GIZaYE1aYpQMBay4tYk7OPZOPJg5NtlqjM8A-BOBgGXydCnVdACpoM5u1sIvD145uHfdpMVZ0USGf6P2KeM8YUQ03R2dzaxQvyJSYaNceDjEDMhRqfo003blCATS82loppNCQCYneh37SrxFBPU5QiJI0u0gFBcJXo2xwAqvb_Mt0rQA2A-WoMa4bV13wA64_PwHeh_P37dZDU8y8EbGFkdtPhikYu6cKvAlhfuhg8utZLx8DV5NHhgMpqNrzWwj8DXFA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpd3ZKdJ0o1B8Ph_7REevBv3ub6tORm6x-b2SkGQyJA2LkSVYi8QL_P0A8u55JweH5Ra88pSbpRRM5gksLYW8yxbcqzYgbIICaDf8b4eB27kcTTr3tENNJTuW74Im5hzZQzoHQSDKg_iNP3R5iKZChB9fknwaIcq8qohtIog1VR99Vw65sTgwu5QOGJdxvNOZpUyarQEV3Ci8UV93xNVCdvQSBwOaYUIQgteaOuFQGoOQhVtSI5svcAARZ50EeopVFAHFTRZ1XO77o1e0PzYYCX6xP4lKqbCsWz7EMcFAQZ3qg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpdsGDim3ckMv_VZKkhtqhHrK9aFnsjH3BHof6P_eSs5ZEuPq4hj6v29KUCOPzOuJPwInHOwfHQTW8KkKVNu5UVd06nLf1V0SzXDeGzgKaJI_iE6rX9SMnw7teIgECRbxbN4QlSn4i971wzdIcOmG1PoXjE6LJDFovOJ_ufkxI8_q-BIHdeQV6kIlUyLp2cyCGvyNrHTlgKfeTAv9YHsEE6IwBP8bpcF5LQhE43InccUMpjD1IB6_qzu046zRoLulNzEnWrpVp7HkgMgBv4vtKJYibGhUbuZqDp7z_8jIqlJGdosZ5ORC3G129rocwSPdi6_mXvAHJS3Z5o_RTOAgAae4ThCCPrwxh5CxOav7hPtQ76qlfwcbxIVDUqo4sUxYufztVTE-y4VNPDN12mMq8-WykkESm9KcntV4vjIR3S_nssAiUeptDygyKraXg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpe4Li_MYVhnMQDKYrpsP2EgecWEUB90t5bLz1oz9q4HgN34-SYcHSRD5AINhzjcoWAlG73o46WSSkqa0GwrWewSYmQ-AfXXVKpbJIiIE0fiQZyYOZViY7e0t0NGqegI3RCLkti-5FN4IB8ioI7g7HS31gFbVCckHJWt2j3pHTsFIbMEOj7cctindEzkxKXaNuobuJrwwsbISot6j59oF59ScrSyg8Ca5NGl0l0V0U6i2U2T_I1q5tosahaw1yXsRLkohzkoKq0UTTkFuXm67aeZOh4hFYqgR5NasuJ91NSGqQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJs9fNB_NBO4gRMOrGXe8yUsI/photos/ATKogpdQuoQM1HvHQx0-QvM3WPez23fN0qfafsPBwdNANDm82AWVcekeXcMJb9bqLHzftw6f0t6OKpDfJOSuAh2cHYiTXdJm6UodwDIoDzgHrHsN4_D75nNCgpoOhwPICsdAMh2ccJFvJ-RVrhnhI4k8-yqoG_cLA0kfn_ULMiKwmqtRzFvWn_kvrD5EjFNI7GTeNdgVixlhsUzxeHiyiiZvHN0SSC2CX28yADHqhlF61Wy3gWhTvXKCe9gtqZKh4W6Yum3OSYydKOhOned1udG5_RkxFr_FLCS8dhGZS40-AlOWZA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Bare Aesthetics, LLC.",
        "address": "28775 Telegraph Rd, Flat Rock, MI 48134, USA",
        "phone": "(734) 771-5678",
        "websiteUri": "http://www.bareaestheticsllc.com/",
        "status": "New",
        "score": 2,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpdk_pBlNaqG8RxpkYKe8iUsoj8e7E1sKUVSYaZUOkJWG2GmFlry-MRDwYxhU3cON-VitDknhwaw9qcVS834uQvnVpxa3jDuVg07ijykNXR4ZzwNw7_l5fOBtI07VfOeGBLYeCa95V942y99DTZZ8HUEeymskXrc5LqeLQo-XiE8hum9UizOF_elWX2Q7aHEdk1jC-GKAGlUCVfSsg1NaZUm0ktNGmRRtaF-bTk502jRSprfkTwc7xotS6QqE7omoWAArRwEPDsYgbVxaLpuSl5kpuDwoJ6EyXlaPyXiSgelnw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpc8o4wzK1MEdin4ySFy8rfbwz7290G9sSIYNEO7VC4hFKE9CTeUDWxkhzmaswBX3ICljZKrv1r6fcqjl1VW77kBjsyxcZ_0lTzCK7lS_NpJphyxLKDYg4j3AfePhfxysQ0eQf3_ITs4vTi1ViD3B9OSYXvi1D9SCQeXAy0QzJo2Yc5Ow3XovO8g5kO0BVPNtsPT65iQFDiVIz_wmfMYWLnuk6091oE1nmmKA6gClTNEWhQsfUmiVgo5Fn4qWr32k3Ju4Zyzir-Jn_ZL8e1P-7wAwgMUc5oS0LQg4NHo0LYxzg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpeI4q5xtnwpHvtzhQevcDas6YmaCsXnX36BUgufL3HsAHMsvg3lGS-dVOrMyZzdKjyLHkVOt0XtQg25c_dk1JHFFPZWF0W5PFdMHUk8zbseRmWX4DcqKNPUDe1M7TLf2CWlq99c5ltMapr5G0BEiroqY3Dj4bmsAFrNVwZ905rJQ7t4hgWBJz25E6UQ_7rk37GcACAIr0FqZl0u8xqaodXcRwUjk3qEk7k4BNvAznNvpu0lqDUuZAL6F-yCBq6wcx-7JDUPoOZD2hM9Le0sRx0mkgeXK4YNOqtoMQIuyQTsvA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpfQ3xZjFalPtpHWfQY0v92sjXFpFOWZlPUAVo2M7BR-jBu4-kyJwlG78mMtDHhAicVuLzlFQwqd3fTfVqPISLe2D4CKLBqCk4RZY3sZC8l8otEInvq9sQe9InNH-SY06FVoJvL8shSBjU9lhS-udxFMo7QS6aopRsRuGQ3rkVbaU0Ls_fGjngLS8SU37XPqaT90jEOxqD0PWUjazOOLgJx9DQvH8V3-ZEYlYTAwCNY1P3RckCCBYlqKOiHAm8iAnZteAoSD-Qjw-mdlwRCNzI62uzaPeqWo7OEOrODdXKQgGg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpc0CtYNWOxChA-QFD3zX-xMVxaW8_vm6Crbj9TrwAUwj5D2tFcQNEJHW0AcqkDMw9lToUNBJ2e55euDunC3nzteHzZip4JmrFDDqLErQ0vORbhRyJSh2cAaa6od4EDRfbpXN77o8HIgZFqvTk0pjsE_m_RRX5DeHsRmk12PWpUtmKo0-IY8lXYQhZrAplkFFpf_YAaXulZCqWnjJH108hu_Dug78Y5ZKAO0PuYL9Yfyth8Hv-yiGNd_LXJud2_2Ha6Nn9Q56Io_glw9qHBn0AoH_AgtVFyWufkmdchn7uOpYA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpcFw4qvgiqiP9Rs97ILAht8_iHe7-nPI_fqzN_RLuPCfGJdy3ANk2voIm0jZIuWgBMx8N9pgBgJ4H4tgk22g4YSMY_XYB0OV7NLEZEcMetBBhPbMXSxTAFunfACwANwKUIVAghVyxb069JvwZJA7x_e2Kqln0P4h-RhUX9jSHFd2LfooAs6XJaqmhvmupKfTgDlylQn_yrW1bQK5IUxGYLbxjWjw830ZmP6of27vLHLppB6ShA5KBI1hezpoutCbHJbs6RAU8mbNj97SOY8kqMmLouaPdKggygzjHtXEmX0VA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpdFHSDPW-0MLJ-v98oat8gSB-d-LnrJuo15Ddb0fFkelJr2wD207oYhv5680s12wn619_gxNbDL1YUC7LKCDa7kXK2IUz12lhBVVyK1PjxWLnVFHg6R3pBW5s2MDGuJhOSyNPGtkkd9YB7M1EU5x-Ana8mEH-l1gzEqSgWgXMjE-Yni7tTHmc8Y82dGPiRgC8lZuS16pn5ZVXwxZUlrs71VY1B0TsjorhtwJwo8zYch628hXbuwn9EcP7E_wqSeYtTDl003yy44XhW7UcwV9shg0cTNux2jk1qgwNOBLUGYeYS594ngKqY_d9GzlgRsEEWGnsUdhv2TfRGugaA0Bw9arU2VSFLgvLBTBmV-QS65RcA1UCCpw-W69DNoLCX5GkFrrN2aZRZXKCyA_rnjH8BUM85AJ5BGi2agnES7wEo-Dw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpcxb2gbgpxJYLJpYtmF1HREgPd27C9c3SxtYcQSKtE67IGJbb_rYcjv9mJ9Bhk6raZkRnvaCFZnyPpEr-RI-MM46RVQW1ycvVoMzjsYasF0HW_Iensb5OSM-gKRAIEHzMBgGULTaGn74KTlk_F5I-y404OMyyNueevG362FKLEPNqBcK2-2ltz4230Wg3TvR_iZ-VnUJUEH2G1RgBer6w0fQiNd3eD2mBI6nmOIbvhGqBVNdSCYmlYkohMbChtZmKbnp03NNhcxFT4Hho3zq75O8ANinWe1jIJt2WuHig4AHEvjFcd12QaoV9oArTq_BagesAW9Y0hZStchylXjVBjm3ah7pNQG1DNdLB8zMRuou4LT9a6Wo4JUgYTEHI_Q1PhjTF97HgeFKKZ6V21uTuyA6v8mVFg4xcraQME0zyo/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpdiR-wV4evM0VfMXjKWuwlBg9HCWJ3ls1UQ2HsKArCZhYBh5AtVURSNkDmnYoDzeUy17WBwgdFVt08byNV1MIzFvAHVf2wOo1LrrXyIwzN3ZabiMhm6vdcjsGeHezCbls5SSxNIszlYR9BUR8yW5k8PP72PGoqPUUDF1RAvPBiXjZTKPg9l-0HWcQFgvb02OohQWVe4Xej6Xgou1rc3K0dvOSp6twg2DW6k-NGHKcYUcjhMoHoCiDddn1CtqAN0CSSwBdMXuGkPruqxfaIeIGU4E9W8uge7Eg0l68CYLBa5Ug/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJJ8d0q0FBO4gR7WVpQCLuvcY/photos/ATKogpdKVuO14Y8_lH9Nzcgx_twI4-3BPLgSYJXO0rXI_Z6Dz4z27HlG2fQLwjOPSbm5MwEPdAb4etxcMRWkFxiWWmBiN9XxXaepSJC0bZP5pXCWYwgimay7IhZHkcD5sMG51YM41upfhjXfLtThOufdXl7PR8ywbX1KzATCJFj0wDhR3-d4MOrgm_JYMaX0wykITOZgi4k6F7CrqWeePxEI8fHbY3Xz8--oQsOJI670ik4w5RGj2DOkR7Job85evyKd6bLg9OiNrlvo5YVyyEtITHBjw7zmRfhrbJBavL9cTClWXw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Be Gorgeous Salon & Spa",
        "address": "23000 Eureka Rd, Taylor, MI 48180, USA",
        "phone": "(734) 287-2201",
        "websiteUri": "http://begorgeousmi.com/",
        "generativeSummary": {
            "overview": {
                "text": "Salon specializing in hair coloring, highlights, cuts and perms; also offering waxing and threading.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2I0ODAxNWY5MjRjYmQ6MHhkZjg3MTNjZDg2YWVkZDNlMAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 23,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpeE_smHwc7dyfqnV--JCKGLLDP6f67ZlvxOC6WBK07KoTaH98SozQkC279FfT2hR8pA5NIer-wQAM4UC-O78LCrRGj-8C5Y1B_WhjHTfj93dV7S1KYkKESzDw4_fj0-VoEBPz35Vr5aPcrHws-DdXMhDYbD6q1_AMVC_ObX7PtGmYKKkGJddX1CHKr_6Adol9HdQIS_LReC4z_80n6jKRm6JUniTaRkdJcaMbvBzfI_DV6CwvRKi3E093A-hjSOii4-4iTNPnLDYTQr4kf63Q-2LdtnsfyydbnTc9sAlRJeMQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpdNwk7VrqrxpswKzQ430kVanSB6zS3iIVcWz7LR1mHN7ejmGCVYwecqTUKV1tXLWA4Z6-xUJemKaVs9E_XTw7XJihQAGWMDpmsFD3J115tXFkxx_Hfl-w3tPtXVt2EFQcYp0Yb-LEOBJng6_1t93GXrql3NhdZD3D4xbirAXoRyavtrhYh7Gkm00SK82AI4c9EXc6f4UaeU0WnoOgeYRKZs96HfKBynweFInNi2FkwH2LtT9I-m0Oxc929fVweImGe-DeDPTz4OZyMlCZSB_N27_svM4j2P8cyZbqp4BsP65w/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpeTSVPkPMwnXpAtPTNUYTrVCwBMkoEG5fOCgLUMyzO9-OQOczMKAkm03iAxPSAry_pdh8QPrLFF3_PpXgZr4pKuPSaIFbPt0HGmkotNnbL6KGB47_VynR681pin_quLHlJnD7sPP7MftNSLOMwDIjCpB60WbLhQWw-lBr0SbpAdJD51fsrzt2Jm0LIwxWz91Vzo56TsHy3mXbqwjw9auPvHPDNAmx5D3-EitRoKYsD0s4tMcYInwhrJJ9tx-2uihKaodbmEyhvDstsIOIchw4FKiBGLepy85ri6Eut8MPYxZg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpdHS1YxA8m5loPg6p0v8taIWYhlsyhmR2AHrzofQV21VzKhRniN-nEa6w3z9dVyWppLU7R33-tnmo7gr_JWrgYY1Q0ZPw8Lfvwex6JSY3MtVJCVEW2xyhoKLFK27OgbGOLmIuhGxIekzi9zcqkVigkuRKLTQzUj_RvlttgnzJXVt3smK8wdo2fGXrzYH2W6rxbJW2Wkqh8kQA06xpaUhoTusEwIGi5Fi7EQpX9lMnnexRpes1GvJdIbszBS8garpQFEDFJIqhLxdFG5JC2yrPqRft32TDXXvaOiNFAeq6D9FA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpeJucZcaacJ6qIaXni-hkHUZrW62uuKa3OAyQbhJaj4ALK5SlYLMRDztx-v7ncZp3jWIwoNWMH8yuDSSBUS0jPUsN8jyDnC8LFuaoD-OnoNhO8QrKBTxtXSBm2v_9gyL9HnW5mliUYNqbxNEpN4Rkvz9QD8FzjQVypdmooXHgenkTcTfuFrtYbUKv84-V6KiDOf0AGwkqYc07UT7v40139PzpNGZ8Ko9WpvAou_6dnz3nDFws77gW5gabQlzARCCh9kU1TlCl6a3deeMFS7TuYpSVWzRhG4_FtF9QwiXbUf5g/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpeRxK8h5u6aXDUw7SnV8ZEQ1bivc9qg1g-5vUtHkGbmqr0wqIfmHNFUIXJfWVykG_lrSHJpsnGCROWdSY7bbHwglFSIKSx-OZ5gzEccXvIxOP2Dg6biscDCLjDiD1fk3AagT1ch__aj4A8WcizNot_ODy6-m3IabcjTu2J3nvfeR6xK-dd43WYMJi_AezqN7vtOfNjoUjSUc03fKuL9D5HVcWx2ksD6XfE_oBeh_l-ev9Qrm1UCUqs9YulEg4h8yCwUHzBlsnyH7ZJCQ1PDdVv9c2Jr1ZBJV6A0y6T5rLZpBw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpdZTpRshB2T_KEH2Hz2D83qhlo2e3uMn2PR2pf7K-5_zoPqEoxQCd7XdWVY5hEQMP9HrxfPiK_JNKGZCnvSrPbprRl7cUr3ismRbo5RymeRjdlWaji105pGInlUXOjiPngoffX631WquU1EiV_MYsXPd7c6cInZFXlB7rEiZv0IEKM2g3UYSRAFYrxOJVfxD0AgFsVPz1-em0CzUsNiCZCS85YddYq0SG2WhQ4zVKRa2Dn55LuQQHJnvgJ8NWfsZi62_-GYnr-BiaXuz3FcPNowt0m0uCEnQ8AcGq5vpNj2gTyZbK1rDwHLA_kxLiLfLYWwCjby8Xe0BCnxiloiz2AJ27CDtFFKufNkTOZxZskAeXfW1LgIQaB3NhYbtlVwb8us0-Odp6vGbiH_Qa_yFdO4WWrf-Uh-DUObG-l3OdXgCUM1/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpdjphiYWb0sSfijXIw3573ahKS7RIPjfSJ_LaXLaGVVGbXU4CH6zyzeetZqRYYJPUpOL7v238C3yGSSm6RnIlM6RkP7cdxuBZ3mTJ_J5VXvCXm8yI1nVjxDiXMOTRBKLhtQTjLSLhnpA23FBBQluIuYGwFDkPgKhVn8NpAlaSpJCGBQT2vjsh7cMuy0JnPrvX_Bt_gvLu7SmFUfZufrlOWGXEpKBw6Czosr5NPMDTEuMpJ9Dut7Jgb70Xgf_yfHd5AKUbEHHeh701jENpjAnnccchzloDIeFr7Seo33TqFdZw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpd3g9MvJg-qcNDf14JtaMCiqI-26X2ndKZS1I-UMitccCTgKQPmcq5ZRCGeLSTv7XQxgXraoOyRSMBzP68_dS89SUzOUNW_qq95g7vWrQrV-rYqneC3NEukN79EtBtDNAs4vR_mgZEDOg5oEqocg6yQGND-8oL_3ciPw_fNbijRXCCqnGuyU9m4QRfum485VzFf-o41fy3OfiBA0Yy6c0Gfyx9FRxEEgRUiYlvKgMbcywTo_5gdc8l_K2MIM80q-Y6nRCskT8PVPJUD21uNb92CaHM0iT9k30nAvuAPZZroqUeL75t9OqHYV5itItuja98Jw3IChzMPPkZVe2pWliAkZ2glWDqjhtBF_8gC5aDKMOFNcavOdM4xfHIxyvNWmAVz0nnJwZBi4cga5KlneZIwV35NgzxLloCYH8pgkbkZ3vJU/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJvUySXwFIO4gRPt2uhs0Th98/photos/ATKogpdXtA-54tAs-FAzV9PocG-tgvAi1eGlrQp3acEuPsveReElkL__l-ChUgsmGaqucgIf52hz73v0wTsSyCmuIayLfz1olNWEek71NdUhfbVrrDse4oNTgxUyfGf7ZuKAJwrKlaaGGCVS_PvlxZenRWz3zqHYnAiSmthG2Mypp5DxTnIruQIBj7_RVsiUHZwM9zwnfjAAGKx5TNd5GwsoLPda23U_SZo8rQyX3kmFmqdgT2c7zRrTqrI7Lnglon8sp0PUlHDvB_jY_JgUSyAM_dWTzYdXdS8i7_nKfWW2WCPsww/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Bare Confidence Skin",
        "address": "22440 Huron River Dr, Rockwood, MI 48173, USA",
        "phone": "(734) 628-2621",
        "websiteUri": "https://www.bareconfidenceskin.com/",
        "generativeSummary": {
            "overview": {
                "text": "Spa offering a range of services, including facials, eyebrow care, and microchanneling.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2IzZmY1OGVlMzUxNWQ6MHg2YWMwZDI4NzliZDJjMjViMAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 0,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpfse0N_Cqpd7Syj6UoItyBNivTtdKYO81RyENDyBT7LUyU2I7g12zjXVn6WufubVaSxMQl6bUDs6q2v4nc8FXCT8oDEPu9YloZRKbSVNYOLuBytlSC2DWSNSLHY4oYoteRuUpSv65oQQM_NRzKsjgJB8lUCGf0qx-Gc7hq33ii5-EczXGItq1h_mH1DcDaX7S7d38UmpL6teTEFTvYSA1_Xkw0ruRgyfs3mRkoINPzi-aAzB9zSbDceUxyVh83KPldi-5z780oEZ4jeix3beRe2JdcQe_XGaE3o01py8U3y5Q/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpfFmQ6yiPC_PFYAf6hW2DEQFoVnv5WxkgwbP8kyhq2Uwg6RDC-Byy7RITUWXFPeS5VU43CTS5WdUk4WhmFu0SMcfzgvbN3CzCTWKNUUkLCw9v7ZiQfhbWUvKc7mqmwCYA8U5v8FpOenVeBN3hDgi3A4K-LKegCRL9GhyRpfJ38IdWEIA21JxSUw2IN-CHDxX_t-fXVdMkPgErJZ4yz5rDqIShyBgA8Btbqc95FL_HiET_20941OGqEYWoy2CbKCJSH23h7YmATDTu7EjYLOBlcK2OZpSgf4L4JJ6yygSdXdZQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpdhSrluYP_LdOt1pq6LEnkhMxBO48h9Yb34VDwd3Rtvq_1DzBeOuSP6aD37OAfs4ErHhb7T0E463Uv1YPrc72Ej3CFOvHMn0DQMJ0g5FMVp01T9fvNT7_pTWpM3o4F_cLKhrW9aQkYfBnPYzRDu4to2xcMbC5TNGW_G8ZJf_gj8K1QWGIJAGbPOK5sc7roAq372CoIDo974IltsuPm8bNlGJGtUQuunZof3SDDkybRnTGv9tgdUvr8TtH6v3BhOblf1WA1iupnBO-FT9RFyqUl4Cm8gTYvRGqfnejcMsOnw1g/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpcjYmz2OUgoIuWj3U-Ua2TfpoCU8BHDu_RZnfZR9VJNp709UAJ4C0aUaVfZw0kAFtOrzU_sHD_-dmyGmmkxzMSCUmJWMXGdorua2UJTp0geWG119a4eCH3ppHvQSVbnJcrHaPAvrtpB2BGHD2jKHBRRGuSveFkBtArr20bOF27Dl-zRGr-cpnLqVNjFuQ9xtVzHbo3KkdirzwE376ANywATpe_GuzIwfNMJjtEUA6uSBH98QO4lf2pQJhWkMd4WzgD0RBa1WtEXHCuyK7xFQchD10SdELEEhC6csbXO4S-otQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpcfqu7A_2yPzPcqybJ4EnGY_tSJJ_7qzmqSxbAIt6z-oMM1fGFNEjoLZdNd-e5eKulxpbi6hsMJXTyCw4oSFJJ6n3VUI2Qf1WLHjyvlK17YAFxp2z8MUcsRbBJSzv9FE4BXbxMOh4A6hoeNcoNK_Q63dmOiOtyaNhxEob8kQlSiKvc3u95Bc3lmpwuR09lBDuVZ13J3rnHbI65mCClOi3gp9OCPWpiIdheQbdhmXrR5JnCzfkInYsh48Pk833-T2rAKHTDxeNLSu5AGSmDfOQXVfazV1MXqP3CvzCh95BuNxw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpfAQ_1Kbgn2K5RvLt5EJaDmqzb34yZKvlQk3tHzWzu9T8KDNR3T7VlyFiXIN4MJT-3P-UcfSeecUolXTZX803nYRX0JwcK_EMO8Jomna-xLkTKiXKphFlP_a1wBYqJktNxUe_7E5iLPnYp1R-ttSjpGPGNTPVDOMH5Za9J5LqoWiAmdUhrjoacD36HnT1ta7WlGbQuxMq2KghSrjM-Y78xp5q02suM9t5xP3T-AKeOxTiq4rOxVtoeacPDrTrcCgae--Ru-G2jTQnKlLtzyKo9xFvNobb2B8vJdOjYbMbWHNA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpeCmDgcXGQ_l3LCwKcyy1JKZrVlq4FZ1TGxiZKxvU1NaDRZSmnxzRlr67UzCXrjs0kEPRXOa5LE3pOVupt-hknoxQl6s-LBMnU5zvZm42pQssXuG9_BLIImmJQqM1-7AF_lpcfhYSxElQwxwOojxv3n6wdMa-c4Az5oSsyGY_kvNHNyxksVZ5WL9hQZW4jFe6k_A8kCAmgPn8B6v2txbQLHxgXnA3K0X3Fd_4XE02ZcdSku0cB120TRMszO3umh5I-8EzPl6no-QzzUpqe6P5k8ojEYZ3xIBJi_VqPongVSww/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpc7PKvLvBuw0VJDhJmuYLJRkVpnRyPjS-T_StYPaHlxzo2mKmq2bYDhi_ZQp7VY4xCypxUObeAAcE5DMwo-s_vUf-xTAvxCQkA7EOFCIvjY5Bty3LrH2G4CNi-72qQTeehZ4PfNpmHqEHvJGknXQUqJ5RxwBq0sGZuuhlxGB08iZIsCNtf2LsX2B4NW-P8QQ2LSuG04byTyYA2WjJZAZrjrgAAEZT8aNHmwkR5kg2Js5GLlinPGEqPh_tY6R-tmlyJH9QK6zww1jBpbYJcrXXH99f5TDbe6uh0x7Dk2Vyqk4A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpdQM4gEvG8kvj_afmGiCWzohL2oYINa56fnsC3eiJTgdh24WSFpOY3PNa0ziguo6BxzyfcB1bvM35oiQJJTWCjfcBhWCU_XD0MBp1PdTGgsoLukN9c6pE0cCxDdtgQRVZCH_Q03GRvei9Sfd0KVdSoZaBx_jui9mLnJkFOxD5HANihH6dHzzE4zjCFpnISLiRcpGz4IIT6i2IK6G1PskYH6cjSIOsjd-1h0vt4pMZmzEcw9J6j4jwY-J5IdjXFDM6f0ShoikceNHaOhnCRj2Wp6QV5q5kivd-3jtlF5iDYwYw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJXVHjjvU_O4gRW8LSm4fSwGo/photos/ATKogpfaWW9bXYlBY3Gen-mQflbC-QKYBBQf9dt_1yNGvyhqhIt7DvoodIRr0n-Kk3npOHsu3FMfAkHpWe_cPZESMT5WUJ1jJ1zXx_b01EyneP4bTxrLn1L6QVq7b_4aqYHe9k8jw23zZmX4ZOTjCFdBKLjKDaEkZxPKwTEPr4vtClnmdyJA3yS-shUfcCF9FAN5GjuV4PpBsbVIybUzFODfkrhugoyDcL9uoat4FR9O7VlDvxL5pRCp98yewC39uCvKHret95A3xM4P5vuxLXo_ZLoNpht5wRcZVC_EfYDLU4gLDA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Kneaded Relief Massage & Spa",
        "address": "13225 Northline Rd, Southgate, MI 48195, USA",
        "phone": "(734) 246-1466",
        "websiteUri": "https://kneadedreliefmassage.com/?utm_source=goole&utm_medium=gmb&utm_campaign=visit",
        "status": "New",
        "score": 5,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpeRNvoVcw0Lkd9a3Marx0NygTw2K7lgdqkdhBc2VAJu3xfQJSQrgtn5Sy5HsL3JAPnFiPzfekVBozC4hTyuDXgXpLf3FQ3jKcyXZAkiF7YlJtjnWWCJL6mscfiHO0Q92PuaDsh_uk6ShzdbS0VMPh4VGaBh9BZo5BbJCtEkroFjzrr3ZqR8Y0lnG1-Gm4HfS7TjokYC1SIXn_DJMNbdXD3lOrPkHBlJiNI-qYXCMi9r2yTb24bII2KRLJs2JcnxVzxl9YmAiM0zl-uRGEjRWYstD1JYHz2tjKReQ9pzLwwBgw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpdB6zjUwuIrYk23OdUxTwbBGt6XQtCa0jeZ-5KVlz4NgBcm-F3If2Kq0BsU2mP_tELxqeIKKaZSdzyfeQHMIwn5XFf_2fK3t7FIRZ3ngBtY0WHUnIT7Qb5Z8N2jHcqgjEEn8U0gJUU4Tprxd6uJtQmWkyJPPaIYYzTPoH6KrF-8X40tsGTvXTewsDkq2Aj8dYLeNmb5OKzPRlLjHPhOw1XznyMHIN_wSGGRUW97M3_Sd31th0jlEyrCLsBSZBconf84QyUDUZPQWEqkkNbNnbors3d7tB06FqJVFMWzLYr0jA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpdcBRMWUlemUV4caCUnVxHQnInSnfNfB9t5fZXgfcUVox4w9RRk_V1jif0saWmafkgzyHsHg2TDYnLVgfi8WqQkHybpOkhvd_vHl5wLorZlcXLgAwM-FWpNXCypvjXazAp_zKRdiYFQSjG47ewwAiT5_EXWL__lsGNMlE6EWj0mcigMMv8qgBWsfdaj5ChegLJ6X0OAbuqzL9W--DGycgLRgmaREfCIkqMf_UEfewofdJFk6TNPuOEzCoqxhE2i-2pJ0kZrixmltKOAysRT2RUX02uK3QOtJwC8nu3egy86zbWrI2PS-O7qfVH58CZjH-ZlCKrWB66MkjgEpisiSI-LPdnT5DelnFez9tNXi87C5KI8cYxh7P2j09PLIq6r0TFOsa_-UoXwqM2nvZdy__pM7ksvFXXoFDP4GO1Ouuk5Sw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpewl6ZHJ9TSTe68bMYIHMJ_2RVeeChHGno3OSAHqNhy5bfS7RlP4oERjBjQNg7AYdRQOq5bGPB5Rt2vm3kr6NVoMZ9m4joVGqoieGGhLCUXbSIZHmdl3rq7gyLHsBKP5U0oshGPrY6iZZduD9JUt1xGz_L-O9FP7xkEDClQFPTwVnMK0TbQub-tXl7Sh6P8sGMc2UNVt9wbsaSz-DPnFGtfZHtQjvUGI9mGf_O8rWchAqnm80dut4GCXtoP5w15-DLW4Chvnet55rkeSk4P4gZJwM00q6SgRE1uCyjxpHVu3Q/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpfkYYPqdMAx-nyOr5znmJahnaEsTzC4BttDWQ-kMWTYCWoMNDaGjTBNZdRUUqlz4dxdZ9oMAheqwCx4zCIhqtJ_gzq_sgqz5bfT84RKF8QmAhSwoF4KjP_HCBfVs0Wouoj47Ldt7HVoUiOMuqAAgj5B9G7TiG_E-P2IMpS93s6ZxI-HEvmrQEEnnDVQAoM5dxEojyOuLhnPmLDPkVBzo4_imAClmlGgG90zOl2sX5DDtBHzwF2jV0AQVlDY07AUxI3AKrkyusPyhUthaMUeVQGayEi-zACby4aGctCFsEtQmQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpcPJBuu124aaj5CM1sagTyhODPsPpBlkCHuUruV9l9Ck2U7TzQHWmgeJfSg3yhL9Uey3rk3mAJFe4_ikh2aPuLtFP8XxVTQoRK7z7dDzJ11vlogsQLTxkNMlOasJsUsimTmD6ASZ2HraQAR_DiaHKRp9TSiUaY9aaFvOiLzDNHnJufOZA7jGVHokfPhOgkrxnvvjWQWCvVVpS5AuUSmX-esF8Yd3HCCpOX1hVuVQlv3Ly_9jARdDZHxBOavBxFZZ-uaUaubGHrtt0BC4ysC6J9j1FONgaMb0sVVRD5OSqNS6A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpdyliI-fQ1EcTT15z9E540gMWgAPEs80nv-gOtDbAzUduLvz3_niFgOQV3teQz4VVeTbetBc7zifKuqnJP8-lpPi7NgRNj89vPYKvus09mbdhOoFFpSn51tnlu-5ozjXjD1uHdb4q2tllNNeTXtSZQaKntoTOFpY5ySMIP14AtNVK5W0j5P8ZZwrjEehz1qJVJRMvnFyfxwzQYYSDHFpg9_fWeK2gHW8zhiedHgW5JNLl5WGpHzw7xbdU41cVhKfMkw_QtB_CD2m5zuc0FKOniJL-AydQbKIEluFk4X6kgz9A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpfK6zx2XPwIBYxEYtwxT2qNDQNey28XOIW5X5LpkHbyeSg4Yg_zGfiqp1dS4f9Omtyc8ZCo9z2R5i3OKZAIok-sV04YQrbcgsedJLW_5JMqY4gT5xDkSW6WtYvgyfHO0vAclqh7Xg8FOaYnUi5C2G_PRlQjoZ9eRk6TGTPQltXnM3jg_duoJB2i7mR4VY1MiEz2-xo0JrhWmjVILWEhnYrg_5TNGeseB-zm1id_YccTuKQTKPWKhqda7yrILuMR494ysP52g2ySjk4dsgaWgGBlo_c-usdiuk5OvyUr4MLg67Lj6-K0Joy8tPNwuNKEzrk0QhnrgVAhd84akiVqoSH7Lmnb2bijkLGbsEc-pJ19lgSeWRh7_iJ_AV7YMsExDxFfR0KbD34-Iyjfn_kVFxbHpNd_NatFc3QMq8e87-7WWA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpd9rXNsE3dJFF-qGTPrwt-HC2VckRPxrjglltvYVPHllMUSF6Ur-PHrm5vCoVP8aAdK1NNUt-eu99qyauC2uFMWsyWQMu-94GxHRyV1i6sYAXGPPgKJu5_mzW7hG814UuZLMN24ZB6MV-dj3SJYZeGWuE6Kgo4SNzEnlE5LANESkL1CqSdlDSrTKRy3ciPgnU3KDucG0iMqwrM3qY4baqxyz0c_O65XzHDydu1KJDWVGpxXuGBaVOTD0ZR7Hq616apYJ35Zf7rXMYV4rVmXl3I3B_K_g62dPVd_l3E6knfwfOVq4S40hfgG6hIGR0EwYx7UUCS6Sk14GhacezJ_Df2co322EgA7HjGTE7nSJOEt5t-3rA6WEJyIpGmtcGPD_ou8NbHKbbb8umzxuLceSzER0bsbVIAtMLjA7AAz-a103g/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJsePIexU3O4gRmaIfo9zDPsk/photos/ATKogpfgpDlBenYxy0zKQ5cPU6qiGQw5w_6IWfdwMdXD_bKOIHWBLN-1dQ1l9iDH8er7-Crvxi763eeprcouVAA9facxK0npEh_4zlgo70CLosebycwE1GSzewGk1KyuBDoYtbgPryF_N2wn3yS3zC0vtCKuh0NdDxpi6xrvz569y8pTK4xBqAe_s3hLPUvhdc1dwW5JYc7nfLI-OWnmywiEwzV7e5g5PkjlF1clCUS-pWVeVGdd-zr2339HzDA-e9cua1jxE9ifmKlXSeNQFN7Zc--GK0TamBMTjSm_FnB1D0N4iguNcMglG6FyyaDi9mlAUSCtPSYLBOFxu5svOQTJKR7hBDYKbiWziz4pIr5crxgSxFoQfzbfMz5ln0lRVTl0QYCIcqv8N77Kd6pwVHG4caP_gpxwnNxGXqePQF7m6LKYZg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Verna Hair and Body HEAD SPA",
        "address": "10000 Wayne Rd Suite 101, Romulus, MI 48174, USA",
        "phone": "(313) 685-5087",
        "websiteUri": "https://www.vernahairandbody.com/",
        "generativeSummary": {
            "overview": {
                "text": "Individualized care for natural hair in a plant-based concept space boasting relaxing scalp treatments.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2I0ZjdlNDVjZjViMmQ6MHhlYjg0ZmFlNWU5MGIwMzQ4MAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 14,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpfNsqfPKINBTyUECzMc7qtERdffTui2uXP5jhvwOg1WIyOYa0xWEc7GrKoBxMxGV8WMsbO0Y6rlbOK_RDAxT9HXxyU4PmFvSA__ED7U70tHd23jAtzXp6wJbdLEVBzzWfEkJ3kfsZYyu8oMoxo6-3teYo0kU0JZTOHydGQy0I1CxsWC4TKY9LQEf2hU4lnaFAzhfmKEXRAfC2hHA-Yx-mq2aOKV9vxf1VKgPcwXvQG_-dYLN9F5OC8cUe7vNJA5e6ivdxf0q7vEvQ3od0hIujzW8m7x54jAV3Umoxtr3aflGw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpeWfAvkjAvfd3uKEYhweU7yF9qi4g3yJuAvh9Q6ZnBRYVnvMW9tXMAocVEocPMGvBxdfcCSdO1zgb_f6xRqGa0glm3OcDw6FT_Qo1WJYafBj5qUzGyjPuAfMY0Wi0NgF_y1PpiY6a1EodFJd4DEkhc6jz-OGhlKjo2OlQ0PiObwXgfKV4AiZD_nLF1EzRDsyKyhgmCezz43phO2hppGoA9fQCxKSIxPHBKqZt6vhfk8PhXYMrzcUYI5ZFyqlaImJfPCiXDKkUVtr4Q0Z_E25Hhz0FJ6WNavUIMf6bBDDDODkA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpfsdEQ25yZt47pikKIx87DjjEYW2ZZRNZXCdHUt_Q89aX381pMdzIJjO2mXF_zWSTqgXRaTjFSzxo8elq-HMC5aNHKrBsC5cES8srQupEdSvNeYSwGNC3Yzi1a4UbqJiknDzn-RCpSIpJ1EXJRnj1Z6xc5Wg5qi_FymumRujFBKsnrwn6ZNrY9_SBoO4AuqhHSM5hxD3XM5X7ZVP8xhqHbk5BTIqPzTr-S0fVtHBQJB9Ik0NxLuZouFfstPMyZc-GbsRkcwi2AfN950ojYXIm747GZWv3hA6WDskz5W9w0njw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpeueO5hABmlrhu9R1JagbBNRTFB0BY8f91X849zMY-ocOp9LrqGieOR78UGcuR3JGvDtQO_byFYvs2z_3lAJpCXEuCbxfueaUaFALh5-SP9A2xDqGI3pHOaT5e-w9u2SN5T6yubSxwdqadZWMilyFT_MlGX19BA-gg1G4rQ2fHoL226eboc-GxIg-HZav6hacyi966QPk260lJrla3Kno2wibBD_xnqL17SyYmE_VImoYvqaOazELnIElNU9PsLzI3LWGdNOuHafdyEhNcPUsWDN6YV1-KLYS3AhbAgZzbA-g/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpfrW3APjSVUTb__Af4beQEqzg9hMzgZisV5ZLObOmai16fXfEZWrUsmk8r59_NrHuBjAY94OoX--PNT0L4KdzLpJlcfp1krc3al9KlyRO4K6YUr9w5BQnoE5HvwVGI1YT7S84-UNDEO7mITLfZlkHbzBk5j3dpWE4xjhgcO9RWeWqbeHqM6xMGbYzF-mG2uu179E-kj46LsHLjeCllA0dIFp9ZzGlHc9ESGQZSRRb9YhwS-FBhAuzzlEJUUAXUV0AReiR9Du7xOC6oa0q3Cle15tMavBYtHtK1-kYT_IVXfVQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpfRIrlE0NfAyjT6tYP-gSectOzp49xxjvgBqIm71_KzZ-ofNEzZHI51cniZq66fKbATIoI0bKyzA-fa2SWPbHVQDJJK-EmSoJeNOCr-92unqwHLZkkAt0KQMpaoHlvO2cwXEZP0qWpeDfxECYDdl9CWaiPa4DnGrYaHQd6NJ5fdpG6qleh1FAU8uWsAdw9iB9ToSWwIeWd7swsJnCgeoLsFsYyx7rtu4ENA0pWQVD9iM8NirAy6xMOucMXtGEOLMHjvWaVIjQdB_fmy9xPdT-4RU7SDxOxJkvoojRjeP_BCPQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpfU4_c_WI7hYqpsQbfVPlu_MRjXE0b6BRbPGonVLaN7QjpNTlX6nlI-We9FwDrTSuk5vsDDxqP9hOmQSsucNAo6JK4D0y5dZBzOSl29Ij3x_I8YP2fVjIrZ9kMcK5U3sdw2z7h6QbxxXvXUr3kyaAolvsF_4Yq3S0LuA4UsOhwJ46A1W11ixYSvdMplWNdMby3gKixxbgH-P_RmQocjFWDtDtVjpxtwCPITRT-KdvI_6iXp1XmvXI8EvuaNeuXwU0RQbR1axoWglOToOtzctojBPNy5P_aMQ46zIQ4HbE3lAA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpd5bUDJtuC7OpeIu6_LnrElpppoaXguglYgjiPuHxJwReG6W8I46N4R4KIlIcXuKZMTpywomlso4KRGT55yi7_1pi_A3UivQ8LnuL40a0tjxUFCMWYsrogWueCyTrhkyewpVLPCaFkcbSe38vNEg1s0-sD_-vEHbDuM7xIboflJIyydqAPQKc4CmVeSMOMEWEjWuDSxIxIYTX0-6H7cpEzat_ZrBdkns3-Ub_YJjoWo35JHJ2TQ8Iyk0G2CLTtdcgIvoOg0M-O8nL8jiUqO50GWKRR-FiLz3MN5u9oTvFKA7-ykl5A0u-C8ebImySwiMWeiGNTdZ4Z7-yy0XErtF5VL9IlvWaGf53q79Lj1WD6d65gHCp34OBF-mQyn1nXNv-MqehnGrliiFhJ_HNpqF6P9bj_sI2TpAHuoSESMQQ9VhVcV/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpfqxNSgAApBRx2dvELj_f1aViDnGieAxQY4KYVT6Nb8LXOP231YlL6G_VZakUdOGfH1Jbwjzro_6soGC2n8khaRrVTcUrMuNkr-ekce90lDjP-R2sCtjaHuP-Ga0D7kLTR9yIaUyoE8NOPNnDuT7paYGZ7n289dY7eJrFDzYIpPiebLEUpND003fC93R9BH-FgRXk4uoLCw-NdIiorBYU-wLe558w32DxEBk3srQaIxW380CxrjIBF_rifCqCVm8TU61_q0-2DHhRM_7awiOwjNZn8CXcBKyUe1ecOgiEXrkA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJLVvPRX5PO4gRSAML6eX6hOs/photos/ATKogpfmo0Iuj8y6UA4HVYxfPcFKsrF7XhqG5zZuq6jhtjnqnt0VSiJ5Z2VkH43B9MluNyHYjQk9evF9fD3R1M7q4CUnFBMbX8SySXrUBq1SQEDPDI4Khzzt0Ej9PP-eS-cO23cWFacyEjxWt_mkWTce8XGdMRsHDELfekumikdj-hHoFH8wdq4IVkoK209wJaTFdUewfZRGHKG2fQuowUdNmdrpitl7ChfgGNvvbNg9ou7YLxxj5UrvoNqaLkpgzit0j2IBuBovHRe7OMQ1ekkEpr1tlpgE9Eb7qVqXSOJ-Cpgvbg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Indigo Salon, Spa & Boutique",
        "address": "50545 Cherry Hill Rd, Canton Township, MI 48188, USA",
        "phone": "(734) 961-3245",
        "websiteUri": "http://www.indigosalonanddayspa.com/",
        "generativeSummary": {
            "overview": {
                "text": "Relaxed spot for hair stylists, massage therapists, estheticians and boutique.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2I1NDM5OGNkZjRlNmI6MHhhNDZkNzAxMDVkM2MwMmMwMAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 24,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpd4D388JB5tv3OT_7MVj4NaHnAkpaOAJMeIWGUBu76Kfu1NMVhtKE3hZyfgI-GwSSPJX5396-vPb2rM92mwIUUZQitQZWe_mGsVsKKA3iRG9_Y6H6OESwdyXW-3X0mXFoQ9HULuNVGYLHNlZBpBcJIbourvwDzTeSDMlewtTm2Ya3uiFqcCWZkprLHwu0Vf8LROxAm3Z7uSg4A1FJv3VTpe5wQqW-yp4Q5x7wAtuULIXPYBtio4i5chq1rOkgBxSP2iwQvzm52SPfXhc4YkD8nYNsdfBoj8M4qcydVMAbkPrQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpcf1BrtEv4w9MHQFHKuCWyGWAtbmYFczteM8TwlILHhVhqO0aU8fDYPw5dqrlvdpR9O0Kp2QGqzELQQS6k38icnDZ5lbYKneaiVKsZwhl6B-Dhx1E40oIy60okVhJqoX-0vgMgBFz2GUlEnvqTWimCSb0Z9Lnn7N8TsbLFcGL5SRCl24bH7lvHFoyZv7Nr8TFw9_I5nGVvSLYMCAPCJ42EDA5xJnu3qr9OIRvdm3cU5xPUyHpkz3I4LTJeWmBwiPJk4RM-EN-uCO2RVjK1dOQcO4gD4BaAUsh3RwL1KAFeudg/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpdnj0ovRoGQ5gP3kkCKLkAORXlidUnjRukwG_C_672Jh7MPhOzTbmlz60AqhZ9Cj3qizZ0FEgNGBvyBnCMce7g1vhqmH4Gnb7XrMg6BvB-X5EZQSCrGtlI7mTg7TzFxQEBMAQjgLHHQn8j5NFIw5imbNT7JrbkoZPaNtGG_aGE1zCEiw0Y0TR9fzZvu4I8jgnz0wZ2cg5gh-j1e9v6il0RUSqx5mOi9V7Ke_CbVDQ5EcD-HPc6GP-65O1yBljxg_dPqsXNCvavPjW1OaPGlvysfYS8aj0sTwLoi8GA7tAGAmw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpc5bzScj2s6ESEp-GZ4kx3tyfyv6P6DTkDGPrDyXFt8Yv0ynQRSm8KTwYsNZQh32mPPZpiHcqzH608LifeXBeqLiWo5ek8QhUp4D_d3jD7efkZ6AcSfcgKdmFWG0NHXrBQ0FtT52NUOn6qh-BLP6MkcuOzy420AuMILIsG9CzK5iXbm-nZbzz33QpWbYFl6kG2MRomkUvMCO-Vo9OTl3mL1FQVYqFm4IbI6PqJcpmBsZ9G-mXojuka4gwOXjB7PKDVoClCc0U8gDDf8xYPamCNkRzdTqBTXdevAKM-24SrJ8tulUnqHIKkq5-zwdZBqNiPoJn8JVGBgz3Df2fVY2nvrKlZqPAXmhK-bJxUegycTbQruyxU1fgSsyy8kTvhlGeYrPpoKcT-z53nu0DZOXS6h9CPXGWMXP_b64kIyZeA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpfFglXs2B1_ENXp7NICWDEfy9_94lGzoVMoM3vo-A5rPRh1VeKVHIhfOjdjIbSWlGjGtohgizETf_SrkIOShIcAIgnaaWtiEKcP4pLtIMSB2zgLPYf9w-DQ-MlEP-dZJ2Ph1_dmED_PeTq3QRyevL3N8yCgysFucgkz8ylRMim3z-8nUnvDX8yTNNFvuv1MMU9iFj8IKX9Lluvc70a0-OvKrMOHfdNpMsxKSx3WYmUaHDxM6FBFGrZF7KtN2dLLT7hIUjC-tkKOtle_OFKIogZWIQHR9JFe5u-zPAgHpV3EJw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpd7UACVC-IDTsl5un9djXCTG6uYwWYbTREfv9x57AOiH74Ic0mY2lTz9ZOOl3Cg4AfE73us1qCvGgmBuWQu67bX07kS0PxycMOL7GaANTqFxRSczczH4vdbugE3WUm62nPU5GHdjwKzZiCGNZEKJIDTDaW5lTnyZIcpnvoC1v5LoAALkWpg5mavz0MqWsuJlHkjz75HqpcmnaqyGbI0jKpXzOa-H9yI2_Dt33ym_0EfgwD1GeytuAyuc-MLql8RveaeRgb_SLuNUVFSn_S_AfwmK9HvpWoA3DCCPsTsKd7orz9_7kBCWCRumLNfE-zHCnDsxYZCx8y68TyaqwDa5WnXE3Hd2DXFDIJ6NAMRtWkJ_7dn66HPObUYAM_wVIrosWMC9VEHtC7NSnl0S6zb09Bdjt8zPg7MxtZHJbFbmua2zhk/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpetTxmN_wu5hot_oYLApZwVrOdUQxN3XRRAExdW_QETB53Kv-yXXPs1nH4XX2Bnf8BGJSSnkJYdTY0rvXkT7HVacWkF3evzWFn2I1zAlz6p8iGEwdQV_orHLPz7RiKNbem9FFE2_pVcA4lVh19nKz9CyQYuzzvB-LeniJJBWqXXVlUGGLU2AmV3GBdhLNqc-hEOq99XQLYdJEaubjyxNyYSdhWACQ3rgBC_VVmWif8cnpFka8O2c9r9BIG7UISho64isChd-J4VQl3GBe68mOtpDp8Brpi1hxK6-DIryh918A/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpc6k1tmEYuBQ9P_Nx4XrPCVV8CO1edNvdcpB9QHJahNtkQ2C0VPm7DlwdiAASeT0W6F-Hns8Pb1640UNdazIdiTKAh745Zyc1mQa_ezkQRdTLZvWO30Zwab6ybFCpLPzkhebE83Jd8TYHQpaTK-ceSbXJYLEI_duhw6c01vSZHnac5ARBU3JK95mWW1HbmfGSOeBZgiiyCzGArjorc2DgYteBTkzUmgXAFp3VpWQGKAmr6gIZWJP1-ToaW2pDZ7_MBnupfG0opl7o4ozToKxJFPLebOTjPl2wtNn8RSe3DDCT2A6Lg_Yvm4cs4H3CW2uS0pt8_LKsXnDjonDeux8csJ0BuvqbQ-ppIhSQpeMLcZQYw6wOE3j-I3rOAYwOl4kr9m80trQ-t3P0i1TPsRBZ-Jt2hoACmQ8Mljzc3sZA3BqA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpeylaFoYW1SIYuDF49pEzKntkog2SyXFnAsLm3I_wvsRKjOXLLfXkujhPelR_iPm9BMVSo-VgEe1b44FgYnHTdXdNY_49aaPEAV4KlgrEueP02RSANZfn8zaacFue-jd1vI5dd5PuMOkI8uD1i4qcDjGQj-xv7SgOzy29mHW70oZBXnwI4pkuvtQ4gYE2an9YIp3gOqwSzaZkU1v5kJVHInmpUVrMrYsCz9pYRUgQF2CGnrb8BCma40FQZqYErK2G1K07-NmFWnmwITEWQc9wjknvGtG_yDkdR0f75LfrQ5SQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJa07fjDlUO4gRwAI8XRBwbaQ/photos/ATKogpcoTfS68JSrH8zO9yhV--J3cE9FHizPObZEaxLgcOvUvOrcOmjLWewyQL3EVJHwFyWf8uIThtCiaU6yzTeDJvfRat3LhCVyOxeTh920Bq0GlSAvCrTF33ftxY9xrG1mQ3i7nZ4p243D0E4_nrzUk4Umfz-VWLK2AMTrGqyxP3NpQs6pXw_9F_h_s-4XCw5yG1Jj3xSrw_HJBa-EpMh_DxADNJldixN3rj79aBcAqiX8d3rLQ-pQzAUlA8P6iJ5_xl1fO_hTkdKSnkjVObe0IMkIZe0ku5HbNJaGi-qy0sibfPu5LcAQEMpUFQLNiSzg6R2n1bNjWegqg13Wrim2H8yajUX6f3P3chVZBaHLyOb-bM9EmznjurIiluZAfGgsY22Zmf-BanKd3-53abPgUnXAsRSN5iO3gEMiIVPBAqmLeA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "The Avalon Day Spa",
        "address": "18104 Fort St, Riverview, MI 48193, USA",
        "phone": "(248) 686-1259",
        "websiteUri": "http://www.theavalondayspa.com/",
        "generativeSummary": {
            "overview": {
                "text": "Spa offering facials, waxing, and other skin care, plus makeup, tanning, and lash and brow services.",
                "languageCode": "en-US"
            },
            "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4M2IzOTcyY2ZlNmJmNmY6MHhhYmQ4NWMzY2MxYmY4MmEyMAI&d=17924085&t=12",
            "disclosureText": {
                "text": "Summarized with Gemini",
                "languageCode": "en-US"
            }
        },
        "status": "New",
        "score": 3,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJb7_mz3I5O4gRooK_wTxc2Ks/photos/ATKogpdPUyN0QEv0BNr0uL1rXGrPXLWtyBuqoObQNAMU6OcSCbwuj4Yjj4aZXUgkqQ4gS-xnCKEELWKJ7w1l7aPjlFJTfCSjKgCikqWplCXWaU-wPOjQG7ObRJeyR1JcnLYkWTIKZcsNk0ju0VaiF5tz428viXNDdlo_u3BHEobUGdzGFJ2e-F_qlJQfZE0nIA2ZzYNtclSTd3jG101k-_Jz-JZIFRceQSCbQyf8juPKJI3SLqsoUUdPLkELfWze3V11UQc14wRjufWtVWiAWP5MgLhAQw1SIv33_zhe-E8x8I6GJQ/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4",
            "https://places.googleapis.com/v1/places/ChIJb7_mz3I5O4gRooK_wTxc2Ks/photos/ATKogpfoK-2STA4T9dMaAsra5Uh9P6GKnQalF0TydN-LXJkCOHiFrEo8tD8bTH7QX2lbUFefp0G2BecbKkSE1EDcNkJ_wySP7th-P3KJ9BsEywOijhRt7MyW1L2s0PSNTkVgRUtbeOZQ60wFMqk3RlTMv2YOgauPlJpRAaORWgwmj0y-TI0pWK3Dcqz25YLi2m10nvGpPFBiCZI_Nwu9xppCL0gs6AaI7tO-Roh93ziqyl3EroivUeYk_IY2_AWNh1VwsTN25Cp1EmnmBQN2zTGREd4WoNb5TtpSmrfgyI2nTxGMtw/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    },
    {
        "name": "Lunar Day Spa",
        "address": "100 Maple St Suite 108, Wyandotte, MI 48192, USA",
        "phone": "(734) 250-9222",
        "websiteUri": "https://lunardayspa.glossgenius.com/",
        "status": "New",
        "score": 17,
        "photoUrls": [
            "https://places.googleapis.com/v1/places/ChIJ4xHM-gcxO4gRBDS8OGmaoy0/photos/ATKogpfGa5rCX_k37dbHQZB6JiuzG39QHtdwi2hjMT8wHFMJPyabVCr3KbkVksLxuq7DmPPahNlRrRLzKhGZyyIisX3mfzUyP-ttekySHiva9MX7hh-yC4f3eO3kAKLiV412oYD5U2j2_r23Qh8cMVXmfn42-pzl80dUMeafzoNNlhkfhIt8LMMS-Z8PiZFIR9aQDrdHnJHyN53pqmllerQU6Tt8gHnBz2ZUwUtEyw9zS2dm8OYTa0T3jNn3mP7kTAbhfvIrkO4ATR74KFPEOczBodGTeZqAXcfoi3invCSCPfp94NTg3sZFYZlOt7lYTZQzE54ZuJVMaqM-xTEAbwXHwgrHj5GwrtB3uCP1bkBNznjmiXItdOrSeYabGal5L-yIZ_OVcAs_eUVQ4NeazqwR_ZGkAPTM99VnUsYToiXr6_uIDA/media?maxWidthPx=400&key=AIzaSyCDEoaTbC9sIFtuk_YHHRHMUwYICS5bGe4"
        ],
        "currentPhotoIndex": 0
    }
]
import { pathToFileURL } from "url";

/**
 * Standalone runner (only executes when run directly with ts-node)
 * Run with 'node --loader ts-node/esm ./src/lib/web-scraper/web-scraper.ts'
 */
async function main() {
  console.log("Enriching leads...");
  const results = await enrichLead(testObject[12] as any);
  console.log("Results:", JSON.stringify(results, null, 2));
}

// ✅ ESM-safe check
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("Error running scraper:", err);
    process.exit(1);
  });
}


