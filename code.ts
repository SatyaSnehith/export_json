figma.showUI(__html__, { width: 400, height: 300 });

// Define types for layer properties and structure
interface Styles {
  fill: { r: number; g: number; b: number } | null;
  stroke: { r: number; g: number; b: number } | null;
  fontSize: number | null;
  fontFamily: string | null;
}

interface AutoLayout {
  direction: "HORIZONTAL" | "VERTICAL" | null;
  spacing: number | null;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  alignment: string | null;
  crossAxisAlignment: string | null;
}

interface Layer {
  id: string;
  name: string;
  type: string;
  width: number | null;
  height: number | null;
  x: number;
  y: number;
  styles: Styles;
  autoLayout: AutoLayout | null;
  children: Layer[];
}

// Function to process a node and convert it into a Layer object
function processNode(node: SceneNode): Layer | null {
  // Skip nodes that are not visible
  if (!node.visible) {
    return null;
  }

  const layer: Layer = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: "width" in node ? node.width : null,
    height: "height" in node ? node.height : null,
    x: node.x || 0,
    y: node.y || 0,
    styles: {
      fill:
          "fills" in node &&
          Array.isArray(node.fills) &&
          node.fills[0]?.type === "SOLID"
              ? (node.fills[0] as SolidPaint).color
              : null,
      stroke:
          "strokes" in node &&
          Array.isArray(node.strokes) &&
          node.strokes[0]?.type === "SOLID"
              ? (node.strokes[0] as SolidPaint).color
              : null,
      fontSize: "fontSize" in node && typeof node.fontSize === "number" ? node.fontSize : null,
      fontFamily:
          "fontName" in node && typeof node.fontName === "object"
              ? node.fontName.family
              : null,
    },
    autoLayout: null,
    children: [],
  };

  if ("layoutMode" in node && node.layoutMode) {
    layer.autoLayout = {
      direction: node.layoutMode as "HORIZONTAL" | "VERTICAL",
      spacing: node.itemSpacing || null,
      padding: {
        top: node.paddingTop || 0,
        right: node.paddingRight || 0,
        bottom: node.paddingBottom || 0,
        left: node.paddingLeft || 0,
      },
      alignment: node.primaryAxisAlignItems || null,
      crossAxisAlignment: node.counterAxisAlignItems || null,
    };
  }

  if ("children" in node) {
    node.children.forEach((child) => {
      const childLayer = processNode(child);
      if (childLayer) {
        layer.children.push(childLayer);
      }
    });
  }

  return layer;
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "export-json") {
    const selectedNodes = figma.currentPage.selection;

    if (selectedNodes.length === 0) {
      figma.ui.postMessage({ type: "error", message: "No frame is selected." });
      return;
    }

    const layers: Layer[] = [];
    selectedNodes.forEach((node) => {
      const processedLayer = processNode(node);
      if (processedLayer) {
        layers.push(processedLayer);
      }
    });

    figma.ui.postMessage({ type: "exported", layers });
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
