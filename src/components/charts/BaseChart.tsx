"use client";

import * as React from "react";
import * as echarts from "echarts";
import { useTheme } from "next-themes";
import { Download, Maximize2, Minimize2, BarChart2 } from "lucide-react";
import { ChartType } from "@/types";
import { cn } from "@/utils/cn";

interface BaseChartProps {
  type: ChartType;
  data: any[];
  xAxisKey?: string; // For Category-based charts (Bar, Line, Area)
  valueKeys?: string[]; // Metric columns (orderValue, yield, etc.)
  title?: string;
  loading?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function BaseChart({
  type,
  data,
  xAxisKey,
  valueKeys = [],
  title,
  loading = false,
  showLegend = true,
  className
}: BaseChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const chartInstanceRef = React.useRef<echarts.ECharts | null>(null);
  const { resolvedTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const isDark = resolvedTheme === "dark";

  // Re-draw chart on data, theme, type or size change
  const renderChart = React.useCallback(() => {
    if (!chartRef.current) return;

    // Dispose old instance if exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    // Initialize ECharts with theme
    const chart = echarts.init(chartRef.current, isDark ? "dark" : undefined, {
      renderer: "canvas"
    });
    chartInstanceRef.current = chart;

    if (!data || data.length === 0) {
      chart.setOption({
        title: {
          text: title || "",
          left: "center",
          top: "center",
          textStyle: { color: isDark ? "#94a3b8" : "#64748b", fontSize: 13, fontFamily: "sans-serif" }
        }
      });
      return;
    }

    // Core styling definitions matching CSS themes
    const textColor = isDark ? "#f0f7f2" : "#142918";
    const gridColor = isDark ? "#162f21" : "#d8e2d4";
    const subColor = isDark ? "#7ea78a" : "#55735b";
    
    // Core brand color sequence (nature & agriculture theme)
    const colors = [
      "#15803d", // Deep Leaf Green
      "#d97706", // Amber / Wheat
      "#0284c7", // Sky Blue
      "#84cc16", // Lime
      "#0d9488", // Teal
      "#ea580c", // Terracotta Orange
      "#059669", // Emerald
      "#ca8a04", // Mustard Yellow
      "#22c55e", // Grass Green
      "#1e3a8a"  // Navy
    ];

    // Determine category axis keys
    const xKey = xAxisKey || Object.keys(data[0] || {}).find(k => typeof data[0][k] === "string") || "name";
    const yKeys = valueKeys.length > 0 
      ? valueKeys 
      : Object.keys(data[0] || {}).filter(k => typeof data[0][k] === "number" && k !== xKey);

    const categories = data.map(item => String(item[xKey] || ""));

    // Base Common options
    let option: any = {
      color: colors,
      backgroundColor: "transparent",
      title: {
        text: title,
        left: 10,
        top: 10,
        textStyle: {
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: 14,
          fontWeight: "semibold",
          color: textColor
        }
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        borderColor: gridColor,
        borderWidth: 1,
        textStyle: {
          color: textColor,
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: 12
        },
        axisPointer: {
          type: "shadow"
        }
      },
      grid: {
        left: "4%",
        right: "4%",
        bottom: "8%",
        top: "22%",
        containLabel: true
      },
      legend: showLegend ? {
        show: true,
        type: "scroll",
        top: 10,
        right: 10,
        textStyle: {
          color: subColor,
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: 11
        }
      } : { show: false }
    };

    // Build specific options based on type
    switch (type) {
      case "line":
      case "area": {
        option.xAxis = {
          type: "category",
          data: categories,
          axisLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: subColor }
        };
        option.yAxis = {
          type: "value",
          splitLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: subColor }
        };
        option.series = yKeys.map(key => ({
          name: key,
          data: data.map(item => item[key]),
          type: "line",
          smooth: true,
          symbolSize: 6,
          areaStyle: type === "area" ? { opacity: 0.15 } : undefined
        }));
        break;
      }
      
      case "bar": {
        option.xAxis = {
          type: "category",
          data: categories,
          axisLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: subColor }
        };
        option.yAxis = {
          type: "value",
          splitLine: { lineStyle: { color: gridColor } },
          axisLabel: { color: subColor }
        };
        option.series = yKeys.map(key => ({
          name: key,
          data: data.map(item => item[key]),
          type: "bar",
          barMaxWidth: 35,
          itemStyle: {
            borderRadius: [4, 4, 0, 0]
          }
        }));
        break;
      }

      case "pie":
      case "donut": {
        const metricKey = yKeys[0] || "value";
        const pieData = data.map(item => ({
          name: String(item[xKey] || ""),
          value: item[metricKey]
        }));
        
        option.tooltip = {
          trigger: "item",
          formatter: "{b}: {c} ({d}%)"
        };
        option.series = [
          {
            name: title || "Metrics",
            type: "pie",
            radius: type === "donut" ? ["40%", "70%"] : "70%",
            center: ["50%", "55%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: isDark ? "#0f172a" : "#ffffff",
              borderWidth: 2
            },
            label: {
              show: !isDark,
              position: "outside",
              color: subColor,
              fontSize: 10
            },
            data: pieData
          }
        ];
        break;
      }

      case "treemap": {
        const metricKey = yKeys[0] || "value";
        const treeData = data.map(item => ({
          name: String(item[xKey] || ""),
          value: item[metricKey]
        }));

        option.series = [
          {
            type: "treemap",
            data: treeData,
            breadcrumb: { show: false },
            label: {
              show: true,
              formatter: "{b}\n{c}"
            }
          }
        ];
        break;
      }

      case "funnel": {
        const metricKey = yKeys[0] || "value";
        const funnelData = data.map(item => ({
          name: String(item[xKey] || ""),
          value: item[metricKey]
        }));

        option.series = [
          {
            name: title || "Stage",
            type: "funnel",
            left: "10%",
            top: "20%",
            bottom: "10%",
            width: "80%",
            sort: "descending",
            gap: 2,
            label: {
              show: true,
              position: "inside"
            },
            data: funnelData
          }
        ];
        break;
      }

      case "radar": {
        // Find max values to map radar indicators
        const metricKey = yKeys[0];
        const maxVal = Math.max(...data.map(item => item[metricKey] || 0)) * 1.1;
        const indicators = data.map(item => ({
          name: String(item[xKey] || ""),
          max: maxVal
        }));

        option.radar = {
          indicator: indicators,
          axisLine: { lineStyle: { color: gridColor } },
          splitLine: { lineStyle: { color: gridColor } },
          splitArea: { show: false },
          name: {
            textStyle: { color: subColor, fontSize: 10 }
          }
        };

        option.series = [
          {
            name: title || "Radar Analysis",
            type: "radar",
            data: [
              {
                value: data.map(item => item[metricKey]),
                name: metricKey
              }
            ]
          }
        ];
        break;
      }

      case "heatmap": {
        // Heatmap expects 3D coordinate array: [x, y, value]
        // We will mock dynamic dimensions
        const xFields = data.map(item => String(item[xKey] || ""));
        const yFields = yKeys;
        const matrixData: any[] = [];
        
        data.forEach((item, xIdx) => {
          yKeys.forEach((key, yIdx) => {
            matrixData.push([xIdx, yIdx, item[key] || 0]);
          });
        });

        option.xAxis = {
          type: "category",
          data: xFields,
          splitArea: { show: true },
          axisLabel: { color: subColor }
        };
        option.yAxis = {
          type: "category",
          data: yFields,
          splitArea: { show: true },
          axisLabel: { color: subColor }
        };
        option.visualMap = {
          min: 0,
          max: Math.max(...data.flatMap(item => yKeys.map(k => item[k] || 0))) || 100,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: "2%",
          inRange: {
            color: [colors[0] + "22", colors[0]] // indigo low to high
          }
        };
        option.series = [
          {
            name: "Density",
            type: "heatmap",
            data: matrixData,
            label: { show: false }
          }
        ];
        break;
      }

      case "gauge": {
        const metricKey = yKeys[0];
        const val = data[0]?.[metricKey] || 0;
        option.series = [
          {
            type: "gauge",
            center: ["50%", "60%"],
            startAngle: 180,
            endAngle: 0,
            radius: "95%",
            pointer: { show: true, width: 4 },
            progress: { show: true, itemStyle: { color: colors[0] } },
            axisLine: { lineStyle: { color: gridColor, width: 10 } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: {
              valueAnimation: true,
              formatter: "{value}",
              offsetCenter: [0, "20%"],
              textStyle: { color: textColor, fontSize: 20, fontWeight: "bold" }
            },
            data: [{ value: val }]
          }
        ];
        break;
      }

      default: {
        // Fallback simple Scatter
        const metricKey = yKeys[0] || "value";
        option.xAxis = {
          type: "category",
          data: categories,
          axisLabel: { color: subColor }
        };
        option.yAxis = {
          type: "value",
          axisLabel: { color: subColor }
        };
        option.series = [
          {
            symbolSize: 15,
            data: data.map(item => item[metricKey]),
            type: "scatter"
          }
        ];
        break;
      }
    }

    chart.setOption(option);
  }, [data, xAxisKey, valueKeys, title, type, isDark, showLegend]);

  // Initial render & resize trigger hooks
  React.useEffect(() => {
    renderChart();

    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstanceRef.current?.dispose();
    };
  }, [renderChart]);

  // Export PNG function
  const handleExportPNG = () => {
    if (!chartInstanceRef.current) return;
    const url = chartInstanceRef.current.getDataURL({
      type: "png",
      pixelRatio: 2,
      excludeComponents: ["toolbox"]
    });
    const link = document.createElement("a");
    link.download = `${title?.toLowerCase().replace(/[^a-z0-9]/g, "_") || "growmatrix_chart"}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={cn(
        "relative bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col transition-all duration-200",
        isFullscreen 
          ? "fixed inset-4 z-[99] bg-card flex flex-col p-6 shadow-2xl scale-100 animate-in fade-in duration-200" 
          : className
      )}
    >
      {/* Title Controls toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-primary shrink-0" />
          <h4 className="font-sans font-bold text-xs text-foreground tracking-tight truncate max-w-[200px]">
            {title || "Analytical Metrics"}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleExportPNG}
            className="p-1 rounded hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors duration-150"
            title="Download PNG Chart"
          >
            <Download size={13} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors duration-150"
            title={isFullscreen ? "Exit Fullscreen" : "Maximize Screen"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative flex-1 min-h-[250px] w-full">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/60 z-10">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : null}
        
        <div ref={chartRef} className="w-full h-full min-h-[240px]" />
      </div>
    </div>
  );
}
