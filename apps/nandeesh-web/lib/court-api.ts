import axios, { AxiosInstance } from "axios";
import { z } from "zod";

const COURT_API_BASE = process.env.COURT_API_BASE || "https://court-api.kleopatra.io";
const PHOENIX_BASE   = process.env.PHOENIX_BASE || "https://court-api.kleopatra.io";
const COURT_API_KEY  = process.env.KLEOPATRA_API_KEY || process.env.COURT_API_KEY || "klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104";

const PATH = {
  CNR:    process.env.COURT_API_PATH_CNR    || "/v17/cases/by-cnr",
  SEARCH: process.env.COURT_API_PATH_SEARCH || "/v17/cases/search",
};
const PHOENIX = {
  STATES:    process.env.PHOENIX_PATH_STATES    || "/states",
  DISTRICTS: process.env.PHOENIX_PATH_DISTRICTS || "/districts",
  COMPLEXES: process.env.PHOENIX_PATH_COMPLEXES || "/court-complexes",
  COURTS:    process.env.PHOENIX_PATH_COURTS    || "/courts",
};

function makeClient(baseURL: string): AxiosInstance {
  const c = axios.create({
    baseURL,
    timeout: 120_000,
    headers: COURT_API_KEY ? { Authorization: `Bearer ${COURT_API_KEY}` } : {},
  });
  c.interceptors.response.use(
    (r) => r,
    async (err) => {
      const cfg: any = err.config || {};
      const status = err.response?.status;
      if (!cfg.__retryCount) cfg.__retryCount = 0;
      const retriable = status === 429 || (status && status >= 500);
      if (retriable && cfg.__retryCount < 3) {
        cfg.__retryCount++;
        const wait = 300 * Math.pow(2, cfg.__retryCount); // ~300/600/1200ms
        await new Promise((r) => setTimeout(r, wait));
        return c(cfg);
      }
      throw err;
    }
  );
  return c;
}
const courtHttp   = makeClient(COURT_API_BASE);
const phoenixHttp = makeClient(PHOENIX_BASE);

export type SearchMode = "caseNumber" | "partyName" | "advocateName" | "fir" | "filingNumber";
export type CourtScope = {
  stateCode?: string; districtCode?: string; courtComplexId?: string; courtId?: string;
  benchLevel?: "DISTRICT" | "HIGH_COURT" | "TRIBUNAL" | "SUPREME";
};
export type AdvancedSearchParams = CourtScope & {
  mode: SearchMode;
  caseType?: string; caseNumber?: string; year?: number;
  partyName?: string; advocateName?: string;
  firNumber?: string; policeStation?: string;
  filingNumber?: string;
};

const CaseSummary = z.object({
  cnr: z.string().optional(),
  caseNumber: z.string().optional(),
  caseType: z.string().optional(),
  year: z.string().or(z.number()).optional(),
  courtName: z.string().optional(),
  bench: z.string().optional(),
  parties: z.string().optional(),
  stage: z.string().optional(),
  nextHearingDate: z.string().optional(),
}).passthrough();
export type CaseSummary = z.infer<typeof CaseSummary>;
const CaseListResponse = z.object({ results: z.array(CaseSummary).optional() }).passthrough();
const CnrResponse = z.object({ case: z.any().optional() }).passthrough();

function assert<T>(cond: any, msg: string): asserts cond { if (!cond) throw new Error(msg); }
function qs(obj: Record<string, any>) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k,v]) => { if (v!==undefined && v!==null && `${v}`.length) p.append(k, String(v)); });
  return p.toString();
}

// Phoenix metadata for dropdowns (optional; use if you need cascading pickers)
export const Phoenix = {
  async states() { const { data } = await phoenixHttp.get(PHOENIX.STATES); return data; },
  async districts(stateCode: string) { assert(stateCode, "stateCode required");
    const { data } = await phoenixHttp.get(PHOENIX.DISTRICTS+"?"+qs({ stateCode })); return data; },
  async complexes(districtCode: string) { assert(districtCode, "districtCode required");
    const { data } = await phoenixHttp.get(PHOENIX.COMPLEXES+"?"+qs({ districtCode })); return data; },
  async courts(courtComplexId: string) { assert(courtComplexId, "courtComplexId required");
    const { data } = await phoenixHttp.get(PHOENIX.COURTS+"?"+qs({ courtComplexId })); return data; },
};

// CNR
export async function getCaseByCnr(cnr: string) {
  // Allow flexible CNR format (16 chars with letters, digits, hyphens)
  assert(/^[A-Za-z0-9-]{16}$/.test(cnr), "CNR must be exactly 16 characters and contain only letters, digits, and hyphens");
  const { data } = await courtHttp.get(PATH.CNR + "?" + qs({ cnr }));
  return CnrResponse.parse(data);
}

// Advanced search (maps to vendor's body/query)
export async function searchAdvanced(p: AdvancedSearchParams) {
  if (p.mode === "caseNumber") {
    assert(p.caseType && p.caseNumber && p.year, "Provide caseType, caseNumber, year");
    assert(p.courtId || p.courtComplexId || p.districtCode || p.stateCode, "Provide a court scope");
  }
  if (p.mode === "partyName")    assert(p.partyName, "partyName required");
  if (p.mode === "advocateName") assert(p.advocateName, "advocateName required");
  if (p.mode === "fir")          assert(p.firNumber || p.policeStation, "firNumber or policeStation required");
  if (p.mode === "filingNumber") assert(p.filingNumber, "filingNumber required");

  const query = {
    mode: p.mode,
    stateCode: p.stateCode, districtCode: p.districtCode,
    courtComplexId: p.courtComplexId, courtId: p.courtId, benchLevel: p.benchLevel,
    caseType: p.caseType, caseNumber: p.caseNumber, year: p.year,
    partyName: p.partyName, advocateName: p.advocateName,
    firNumber: p.firNumber, policeStation: p.policeStation,
    filingNumber: p.filingNumber,
  };

  try {
    const { data } = await courtHttp.post(PATH.SEARCH, query);
    return CaseListResponse.parse(data);
  } catch (e: any) {
    if (e?.response?.status === 405) {
      const { data } = await courtHttp.get(PATH.SEARCH + "?" + qs(query));
      return CaseListResponse.parse(data);
    }
    throw e;
  }
}

export function normalizeToTable(r: Awaited<ReturnType<typeof searchAdvanced>>): CaseSummary[] {
  if (Array.isArray((r as any).results)) return (r as any).results;
  if (Array.isArray((r as any).cases))   return (r as any).cases;
  if (Array.isArray(r as any))           return r as any;
  return [];
}