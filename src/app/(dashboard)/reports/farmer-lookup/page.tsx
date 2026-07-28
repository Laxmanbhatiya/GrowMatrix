"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { 
  Sprout, 
  Search, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Phone, 
  Building,
  Maximize2,
  Database,
  TableProperties,
  Settings
} from "lucide-react";
import { useDbStore } from "@/store/dbStore";
import { motion, AnimatePresence } from "framer-motion";

interface FarmerInfo {
  id: string;
  name: string;
  mobile: string;
  villageId: string;
  address: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  totalArea: string;
  totalField: string;
  isActive: boolean;
}

interface AadhaarInfo {
  number: string;
  isActive: boolean;
  isVerified: boolean;
}

interface BankInfo {
  name: string;
  accountNumber: string;
  isActive: boolean;
  isVerified: boolean;
  isPassbookUploaded: boolean;
}

interface FieldPlot {
  id: string;
  number: number;
  area: string;
  coordinates: string;
  polygon?: [number, number][];
  isActive: boolean;
}

interface Agreement {
  status: string;
  type: string;
  createdAt: string;
  isActive: boolean;
}

interface Attestation {
  status: string;
  url: string;
  createdAt: string;
  isActive: boolean;
}

type TableRow = Record<string, string | number | boolean | null>;

interface TableEntry {
  tableName: string;
  rows: TableRow[];
}

interface LookupResult {
  farmer: FarmerInfo;
  aadhaar: AadhaarInfo;
  bank: BankInfo;
  fields: FieldPlot[];
  agreements: Agreement[];
  attestations: Attestation[];
  tableEntries?: TableEntry[];
}

// Minimal shape of the Leaflet global loaded on-demand via CDN script tag
interface LeafletLayer {
  addTo: (map: LeafletMap) => LeafletLayer;
  bindPopup: (html: string, options?: Record<string, unknown>) => LeafletLayer;
  openPopup: () => void;
}

interface LeafletMap {
  setView: (center: [number, number], zoom: number, options?: Record<string, unknown>) => LeafletMap;
  remove: () => void;
}

interface LeafletStatic {
  map: (el: HTMLElement) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletLayer;
  polygon: (coords: [number, number][], options?: Record<string, unknown>) => LeafletLayer;
  circle: (center: [number, number], options?: Record<string, unknown>) => LeafletLayer;
  geoJSON: (data: unknown, options?: Record<string, unknown>) => LeafletLayer;
}

function FarmerLookupContent() {
  const { showNotification, currentUser } = useDbStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState<LookupResult | null>(null);
  
  // Table Selection states
  const [visibleTables, setVisibleTables] = React.useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);
  const [tempVisibleTables, setTempVisibleTables] = React.useState<string[]>([]);
  const [prefLoading, setPrefLoading] = React.useState(false);

  // Table data lazy-load state
  const [tableEntriesData, setTableEntriesData] = React.useState<TableEntry[]>([]);
  const [isTableLoading, setIsTableLoading] = React.useState(false);
  const [tablesLoaded, setTablesLoaded] = React.useState(false);

  const candidateTables = [
    'TBLFK_FARMER_DETAIL',
    'TBLFK_FIELD_DETAIL',
    'TBLFK_FARMER_AADHAAR_DETAIL',
    'TBLFK_FARMER_BANK_DETAIL',
    'TBLFK_FARMER_AGREEMENT',
    'TBLFK_ATTESTATION',
    'TBLFK_ACTIVITY',
    'TBLFK_CENSUS',
    'TBLFK_EKYC_ENABLED_FARMERS',
    'TBLFK_GT_ACTIVITY_ANSWER',
    'TBLFK_GT_LIST',
    'TBLFK_LAND_RECORDS',
    'TBLFK_QC_DATA_04112025',
    'TBLFK_RS_PRACTICE_VALIDATION',
    'TBLFK_SAMPLE_SURVEY',
    'TBLFK_SELF_AFFIDAVIT',
    'TBLFK_STATUS_MAPPING',
    'TBL_LONG_SURVEY',
    'TBL_SHORT_SURVEY'
  ];

  const searchParams = useSearchParams();
  const searchParamVal = searchParams ? searchParams.get("search") : null;

  // Load visibility settings on mount
  React.useEffect(() => {
    if (currentUser?.id) {
      const fetchPrefs = async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/farmer/lookup/preferences?userId=${currentUser.id}`);
          const json = await res.json();
          if (json.success && json.visibleTables) {
            setVisibleTables(json.visibleTables);
          }
        } catch (e) {
          console.error("Failed to load table visibility preferences:", e);
        }
      };
      fetchPrefs();
    }
  }, [currentUser]);

  // Reset table data when farmer changes
  React.useEffect(() => {
    setTableEntriesData([]);
    setTablesLoaded(false);
  }, [data]);

  // Lazy-load tabular data on demand
  const loadTabularData = async () => {
    if (!searchQuery.trim()) return;
    setIsTableLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/farmer/lookup/tables?search=${encodeURIComponent(searchQuery.trim())}&userId=${currentUser?.id || ''}`
      );
      const json = await res.json();
      if (json.success) {
        setTableEntriesData(json.tableEntries || []);
        setTablesLoaded(true);
      } else {
        showNotification(json.error || "Failed to load table data.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Could not reach table data endpoint.", "error");
    } finally {
      setIsTableLoading(false);
    }
  };

  // Save visibility preferences
  const savePreferences = async () => {
    if (!currentUser?.id) return;
    setPrefLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/farmer/lookup/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          visibleTables: tempVisibleTables
        })
      });
      const json = await res.json();
      if (json.success) {
        setVisibleTables(tempVisibleTables);
        setIsConfigOpen(false);
        showNotification("Table visibility preferences saved permanently.", "success");
        if (searchQuery.trim()) {
          triggerSearch(searchQuery.trim());
        }
      } else {
        showNotification("Failed to save preferences.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Error saving preferences.", "error");
    } finally {
      setPrefLoading(false);
    }
  };

  const triggerSearch = React.useCallback(async (val: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/farmer/lookup?search=${encodeURIComponent(val)}&userId=${currentUser?.id || ''}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (searchParamVal) {
      const cleanVal = searchParamVal.trim();
      setSearchQuery(cleanVal);
      triggerSearch(cleanVal);
    }
  }, [searchParamVal, triggerSearch]);

  // Map reference & instance storage
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<LeafletMap | null>(null);
  const markersRef = React.useRef<{ fieldId: string; marker: LeafletLayer; lat: number; lng: number }[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showNotification("Please enter a Farmer ID, Mobile or Aadhaar number.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/farmer/lookup?search=${encodeURIComponent(searchQuery.trim())}&userId=${currentUser?.id || ''}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        showNotification(
          json.isMock 
            ? "Simulating demo records (no exact database match found)." 
            : "Farmer profile successfully retrieved from database.",
          json.isMock ? "info" : "success"
        );
      } else {
        showNotification(json.error || "Failed to search farmer details.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Backend lookup API is unreachable.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize and update Leaflet Map
  React.useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Load Leaflet Assets on demand to bypass Next.js SSR boundaries
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    
    script.onload = () => {
      const L = (window as unknown as { L: LeafletStatic }).L;
      if (!L || !mapContainerRef.current) return;

      // Reset map instance if already initialized
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // If farmer fields exist, center on fields. Otherwise, center on India!
      let centerLat = 22.5937; // India Center
      let centerLng = 78.9629;
      let defaultZoom = 4.5;
      
      if (data && data.fields.length > 0) {
        const parts = data.fields[0].coordinates.split(",");
        centerLat = parseFloat(parts[0]) || 22.5937;
        centerLng = parseFloat(parts[1]) || 78.9629;
        defaultZoom = 14;
      }

      // Build Leaflet instance
      const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], defaultZoom);
      mapInstanceRef.current = map;

      // Premium CartoDB Dark Matter tile layer to match dark-green theme aesthetics
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 20
      }).addTo(map);

      // Clear legacy markers
      markersRef.current = [];

      if (data) {
        // 1. Add polygon overlays for fields
        data.fields.forEach(field => {
          const parts = field.coordinates.split(",");
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (isNaN(lat) || isNaN(lng)) return;

          let layer: LeafletLayer;

          if (field.polygon && field.polygon.length > 0) {
            // Draw actual polygon tagged area boundary
            layer = L.polygon(field.polygon, {
              color: field.isActive ? '#10b981' : '#f43f5e',
              weight: 3,
              opacity: 0.85,
              fillColor: field.isActive ? '#10b981' : '#f43f5e',
              fillOpacity: 0.25,
            }).addTo(map);
          } else {
            // Fallback to circle overlay if polygon data is missing
            layer = L.circle([lat, lng], {
              color: field.isActive ? '#10b981' : '#f43f5e',
              fillColor: field.isActive ? '#10b981' : '#f43f5e',
              fillOpacity: 0.15,
              radius: 180
            }).addTo(map);
          }

          layer.bindPopup(`
            <div class="p-2 text-foreground font-sans bg-[#0c1811]/90 rounded-lg border border-primary/20 text-xs max-w-sm">
              <h6 class="font-bold text-xs text-primary flex items-center gap-1.5 mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Plot Number #${field.number}
              </h6>
              <div class="space-y-0.5 mt-1 text-[10px]">
                <p><span class="text-muted-foreground">Field ID:</span> <code class="font-mono">${field.id}</code></p>
                <p><span class="text-muted-foreground">Area:</span> <strong>${field.area} Acres</strong></p>
                <p><span class="text-muted-foreground">GPS Location:</span> <span class="font-mono">${lat.toFixed(5)}, ${lng.toFixed(5)}</span></p>
                <p><span class="text-muted-foreground">Status:</span> <strong>${field.isActive ? "Active" : "Inactive"}</strong></p>
              </div>
            </div>
          `, { closeButton: false });

          // Save reference for interaction
          markersRef.current.push({ fieldId: field.id, marker: layer, lat, lng });
        });
      } else {
        // 2. Fetch and Draw India boundary highlighters if no farmer selected
        fetch('https://raw.githubusercontent.com/Anujarya30/India_State_Boundary/master/india_state.geojson')
          .then(res => res.json())
          .then(geoJsonData => {
            if (!mapInstanceRef.current) return;
            L.geoJSON(geoJsonData, {
              style: {
                color: '#10b981', // emerald-500 border
                weight: 2,
                opacity: 0.75,
                fillColor: '#10b981', // glowing fill
                fillOpacity: 0.08
              }
            }).addTo(mapInstanceRef.current);
          })
          .catch(err => console.warn('Could not load India GeoJSON boundaries:', err));
      }
    };

    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [data]);

  // Center Map on a specific field click
  const focusField = (field: FieldPlot) => {
    const L = (window as unknown as { L: LeafletStatic }).L;
    if (!L || !mapInstanceRef.current) return;

    const targetMarker = markersRef.current.find(m => m.fieldId === field.id);
    if (targetMarker) {
      mapInstanceRef.current.setView([targetMarker.lat, targetMarker.lng], 15, {
        animate: true,
        duration: 0.8
      });
      targetMarker.marker.openPopup();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sprout size={20} className="text-primary" />
            <span>Farmer Information & Field Lookup</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Search physical table collections by Farmer ID, Mobile or Aadhaar number to view agricultural fields and compliance checks.
          </p>
        </div>
      </div>

      {/* Query search form */}
      <form onSubmit={handleSearch} className="max-w-xl flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            required
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Farmer ID (e.g. ID_1), Mobile (10-digit) or Aadhaar (12-digit)..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors text-foreground placeholder-muted-foreground/60 h-[36px]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 px-4 h-[36px] bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/10 shrink-0"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Search size={13} />
              <span>Search Profile</span>
            </>
          )}
        </button>

        {(searchQuery || data) && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setData(null);
              showNotification("Search view and map focus reset successfully.", "info");
            }}
            className="flex items-center justify-center gap-1.5 px-4 h-[36px] bg-secondary/30 hover:bg-secondary/60 text-foreground text-xs font-semibold rounded-lg border border-border transition-colors cursor-pointer shrink-0"
          >
            Reset
          </button>
        )}
      </form>

      {/* Persistently display Search outcome & Interactive Map panel side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Farmer Profile details or Placeholder prompt */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            {data ? (
              <motion.div
                key={data.farmer.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Farmer Profile Card */}
                {/* Farmer Profile Card */}
                <div className="bg-card border border-border rounded-2xl shadow-xl p-5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-border/40 pb-3 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                        {data.farmer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-foreground">{data.farmer.name}</h3>
                          {data.farmer.isActive ? (
                            <span className="inline-flex items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold">Active</span>
                          ) : (
                            <span className="inline-flex items-center bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold">Inactive</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground tracking-tight mt-0.5">
                          Farmer Unique ID: <code className="font-mono text-primary/80 font-bold">{data.farmer.id}</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider block">Mobile Number</span>
                      <p className="font-medium text-foreground flex items-center gap-1.5">
                        <Phone size={10} className="text-primary/70" />
                        <span>{data.farmer.mobile}</span>
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider block">Aadhaar Card</span>
                      <div className="flex flex-col gap-1 mt-0.5">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <FileText size={10} className="text-primary/70" />
                          <span>{data.aadhaar.number}</span>
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {data.aadhaar.isVerified ? (
                            <span className="inline-flex items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1 rounded text-[7px] font-bold">✓ Verified</span>
                          ) : (
                            <span className="inline-flex items-center bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1 rounded text-[7px] font-bold">⚠ Unverified</span>
                          )}
                          {data.aadhaar.isActive ? (
                            <span className="inline-flex items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1 rounded text-[7px] font-bold">Active</span>
                          ) : (
                            <span className="inline-flex items-center bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1 rounded text-[7px] font-bold">Inactive</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Bank Details section */}
                    <div className="space-y-0.5 col-span-2 border-t border-border/20 pt-2">
                      <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider block">Bank Details</span>
                      <div className="flex items-center justify-between flex-wrap gap-2 mt-0.5">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <Building size={10} className="text-primary/70" />
                          <span>{data.bank.name} - <code className="font-mono text-foreground/80">{data.bank.accountNumber}</code></span>
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {data.bank.isVerified ? (
                            <span className="inline-flex items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold">✓ Verified</span>
                          ) : (
                            <span className="inline-flex items-center bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold">⚠ Unverified</span>
                          )}
                          {data.bank.isPassbookUploaded ? (
                            <span className="inline-flex items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold">✓ Passbook</span>
                          ) : (
                            <span className="inline-flex items-center bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold">No Passbook</span>
                          )}
                          {data.bank.isActive ? (
                            <span className="inline-flex items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold">Active</span>
                          ) : (
                            <span className="inline-flex items-center bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold">Inactive</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5 col-span-2 border-t border-border/20 pt-2">
                      <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider block">Residential Address</span>
                      <p className="font-medium text-foreground flex items-start gap-1.5 leading-relaxed">
                        <MapPin size={10} className="text-primary/70 mt-0.5" />
                        <span>{data.farmer.address}</span>
                      </p>
                    </div>
                    <div className="space-y-0.5 col-span-2 border-t border-border/20 pt-2">
                      <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider block">Geographic Location</span>
                      <div className="grid grid-cols-2 gap-2 mt-1 font-medium text-foreground">
                        <div className="bg-secondary/20 border border-border/40 rounded px-2 py-1 flex items-center justify-between">
                          <span className="text-muted-foreground text-[8px] uppercase font-semibold">State</span>
                          <span>{data.farmer.state}</span>
                        </div>
                        <div className="bg-secondary/20 border border-border/40 rounded px-2 py-1 flex items-center justify-between">
                          <span className="text-muted-foreground text-[8px] uppercase font-semibold">District</span>
                          <span>{data.farmer.district}</span>
                        </div>
                        <div className="bg-secondary/20 border border-border/40 rounded px-2 py-1 flex items-center justify-between">
                          <span className="text-muted-foreground text-[8px] uppercase font-semibold">Taluka</span>
                          <span>{data.farmer.taluka}</span>
                        </div>
                        <div className="bg-secondary/20 border border-border/40 rounded px-2 py-1 flex items-center justify-between">
                          <span className="text-muted-foreground text-[8px] uppercase font-semibold">Village</span>
                          <span>{data.farmer.village}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5 border-t border-border/20 pt-2">
                      <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider block">Farming Area</span>
                      <p className="font-bold text-foreground text-xs text-primary">{data.farmer.totalArea}</p>
                    </div>
                    <div className="space-y-0.5 border-t border-border/20 pt-2">
                      <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider block">Total Field Plots</span>
                      <p className="font-bold text-foreground text-xs text-primary">{data.farmer.totalField} Plots</p>
                    </div>
                  </div>
                </div>

                {/* Compliance Badges Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Agreement Status Card */}
                  <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-wide text-muted-foreground block">
                          Program Agreement
                        </span>
                        {data.agreements[0]?.isActive ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1 rounded text-[7px] font-bold">Active</span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1 rounded text-[7px] font-bold">Inactive</span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-foreground truncate">
                        {data.agreements[0]?.type || "Carbon Credit Agreement"}
                      </h5>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {data.agreements[0]?.status === "signed" ? (
                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                          <CheckCircle size={10} />
                          <span>Signed / Done</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                          <AlertCircle size={10} />
                          <span>{data.agreements[0]?.status || "Pending"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attestation Status Card */}
                  <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-wide text-muted-foreground block">
                          Practice Attestation
                        </span>
                        {data.attestations[0]?.isActive ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1 rounded text-[7px] font-bold">Active</span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1 rounded text-[7px] font-bold">Inactive</span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-foreground truncate">
                        Self-Declaration Affidavit
                      </h5>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {data.attestations[0]?.status === "Completed" || data.attestations[0]?.status === "Approved" ? (
                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                          <CheckCircle size={10} />
                          <span>Submitted / Done</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                          <AlertCircle size={10} />
                          <span>{data.attestations[0]?.status || "Not Attested"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fields registry Catalog List */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-xs text-foreground flex items-center justify-between border-b border-border/40 pb-2">
                    <span>Plots Register ({data.fields.length})</span>
                    <span className="text-[10px] text-muted-foreground">Click plot to map center</span>
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {data.fields.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic text-center py-4">No field plots mapped.</p>
                    ) : (
                      data.fields.map(field => (
                        <button
                          key={field.id}
                          onClick={() => focusField(field)}
                          className="w-full flex items-center justify-between p-2.5 bg-secondary/20 hover:bg-secondary/60 border border-border/40 hover:border-primary/20 rounded-lg text-left transition-all duration-150 cursor-pointer text-xs group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                              #{field.number}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-[11px] text-foreground group-hover:text-primary transition-colors">
                                  Field ID: {field.id}
                                </p>
                                {field.isActive ? (
                                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1 rounded text-[7px] font-bold">Active</span>
                                ) : (
                                  <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1 rounded text-[7px] font-bold">Inactive</span>
                                )}
                              </div>
                              <p className="text-[9px] text-muted-foreground font-mono">
                                GPS: {field.coordinates}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-foreground">{field.area} Ac</span>
                            <Maximize2 size={10} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-card border border-border rounded-2xl p-6 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <Sprout size={24} className="animate-pulse" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Interactive Farmer Registry</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter a Farmer ID (e.g. <code>ID_1</code>) or Mobile number (e.g. <code>9876543210</code>) above to query profile details and view dynamic mapping overlays.
                </p>
                <div className="text-[10px] text-primary/80 border-t border-border/40 pt-4">
                  The map of India is currently active and highlighted on the right.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Map view is persistently visible */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[480px]">
          <div className="flex-grow border border-primary/20 rounded-2xl overflow-hidden shadow-2xl relative bg-[#040805] flex flex-col">
            {/* Leaflet map div */}
            <div ref={mapContainerRef} className="w-full flex-grow h-[480px] z-10" />

            {/* Leaflet stylesheet overrides inside Next container for custom dark maps */}
            <style jsx global>{`
              .leaflet-container {
                background: #040805 !important;
              }
              .leaflet-popup-content-wrapper, .leaflet-popup-tip {
                background: #0c1811 !important;
                border: 1px solid rgba(16, 185, 129, 0.2) !important;
                color: #ffffff !important;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.6) !important;
              }
              .custom-emerald-pin {
                pointer-events: auto !important;
              }
            `}</style>
          </div>
        </div>

      </div>

      {/* ── Database Ledger Action Row + Lazy Table Data ── */}
      {data && (
        <div className="border-t border-border/20 pt-6 mt-6 space-y-5">
          {/* Action row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-primary" />
              <h3 className="font-sans font-bold text-sm text-foreground">Farmer Database Ledger Entries</h3>
              {tablesLoaded && (
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-medium">
                  {tableEntriesData.length} tables
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Table Settings */}
              <button
                type="button"
                onClick={() => {
                  setTempVisibleTables(visibleTables.length > 0 ? visibleTables : candidateTables);
                  setIsConfigOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium hover:bg-secondary border border-border rounded-lg bg-card transition-colors duration-150 text-muted-foreground cursor-pointer h-[32px]"
              >
                <Settings size={12} className="text-primary" />
                <span>Table Settings</span>
              </button>
              {/* View Tabular Data */}
              <button
                type="button"
                onClick={loadTabularData}
                disabled={isTableLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 h-[32px] shadow-sm"
              >
                {isTableLoading ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    <span>Loading Tables...</span>
                  </>
                ) : (
                  <>
                    <TableProperties size={12} />
                    <span>{tablesLoaded ? 'Refresh Data' : 'View Tabular Data'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tables grid — only shown after loading */}
          <AnimatePresence>
            {tablesLoaded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {tableEntriesData.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Database size={28} className="text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">No tabular data found for this farmer in the selected tables.</p>
                    <p className="text-[10px] text-muted-foreground/60">Try adjusting the Table Settings to include more tables.</p>
                  </div>
                ) : (
                  tableEntriesData.map((table) => (
                    <div key={table.tableName} className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                      {/* Header */}
                      <div className="px-4 py-2.5 bg-secondary/10 border-b border-border/30 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-primary flex items-center gap-2">
                          <TableProperties size={12} className="text-primary/70" />
                          {table.tableName}
                        </span>
                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-medium">
                          {table.rows.length} {table.rows.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      {/* Scrollable table */}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-[10px]">
                          <thead>
                            <tr className="bg-secondary/5 border-b border-border/30">
                              {table.rows.length > 0 && Object.keys(table.rows[0] || {}).map((col: string) => (
                                <th key={col} className="px-3 py-2 text-left text-muted-foreground font-semibold uppercase tracking-wide whitespace-nowrap border-r border-border/20">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row, idx: number) => (
                              <tr key={idx} className="border-b border-border/20 hover:bg-secondary/15 last:border-b-0">
                                {Object.keys(row || {}).map((col) => {
                                  const val = row[col];
                                  const displayVal = typeof val === 'boolean'
                                    ? (val ? 'True' : 'False')
                                    : val === null
                                      ? 'NULL'
                                      : typeof val === 'object'
                                        ? JSON.stringify(val)
                                        : String(val);
                                  return (
                                    <td key={col} className="px-3 py-2 text-foreground font-mono truncate max-w-[200px] border-r border-border/20" title={String(val)}>
                                      {displayVal}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Table Settings Modal ── */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            key="config-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setIsConfigOpen(false); }}
          >
            <motion.div
              key="config-modal-box"
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/20">
                <div className="flex items-center gap-2">
                  <Settings size={15} className="text-primary" />
                  <span className="font-bold text-sm text-foreground">Table Visibility Settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {tempVisibleTables.length} / {candidateTables.length} selected
                  </span>
                  <button
                    onClick={() => setIsConfigOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground px-5 pt-3 pb-1 leading-relaxed">
                Select which database tables should appear in the <strong>Database Ledger</strong> section below the farmer profile.
                Your selection is saved per account and persists across sessions.
              </p>

              {/* Quick actions */}
              <div className="flex items-center gap-2 px-5 pb-2 pt-1">
                <button
                  onClick={() => setTempVisibleTables([...candidateTables])}
                  className="text-[10px] text-primary hover:underline transition"
                >
                  Select All
                </button>
                <span className="text-border">·</span>
                <button
                  onClick={() => setTempVisibleTables([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground hover:underline transition"
                >
                  Deselect All
                </button>
              </div>

              {/* Table list */}
              <div className="px-5 pb-3 max-h-[340px] overflow-y-auto space-y-1 scrollbar-thin">
                {candidateTables.map((tbl) => {
                  const isChecked = tempVisibleTables.includes(tbl);
                  return (
                    <label
                      key={tbl}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-100 ${isChecked ? "bg-primary/8 border border-primary/20" : "hover:bg-secondary/30 border border-transparent"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setTempVisibleTables(prev => prev.filter(t => t !== tbl));
                          } else {
                            setTempVisibleTables(prev => [...prev, tbl]);
                          }
                        }}
                        className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <Database size={11} className={isChecked ? "text-primary" : "text-muted-foreground"} />
                        <span className={`font-mono text-[11px] truncate ${isChecked ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {tbl}
                        </span>
                      </div>
                      {isChecked && (
                        <span className="ml-auto text-[9px] text-primary/80 font-semibold uppercase tracking-wide flex-shrink-0">ON</span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-secondary/10">
                <span className="text-[10px] text-muted-foreground italic">
                  Saved to database · applies globally for your account
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsConfigOpen(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-secondary/50 transition-colors text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePreferences}
                    disabled={prefLoading}
                    className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {prefLoading ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={11} />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FarmerLookupPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-background flex items-center justify-center p-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-sans animate-pulse font-medium">Resolving Farmer Registry...</span>
        </div>
      </div>
    }>
      <FarmerLookupContent />
    </Suspense>
  );
}
