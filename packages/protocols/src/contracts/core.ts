export enum Status {
  IDLE = "idle", // 空闲状态
  PROCESSING = "processing", // AI处理中
  COMPLETED = "completed", // 已完成
  ERROR = "error", // 错误状态
}
export interface Position {
  x: number;
  y: number;
}
export interface NodeRefrence {
  id: string;
  type: string;
}
export abstract class Ast {
  // 编号
  id?: string;
  // 状态
  status?: Status;
}
/**
 * 节点
 */
export abstract class Node extends Ast {
  position?: Position;
}
export class Edge extends Ast {
  // 开始节点
  from?: string;
  fromType?: string;
  // 结束节点
  to?: string;
  toType?: string;
}
/**
 * 文本节点
 */
export abstract class TextNode extends Node {
  type: `TextNode` = `TextNode`;
  text!: string;
}

export class TextToTextEdge extends Edge {
  fromType: `TextNode` = `TextNode`;
  toType: `TextNode` = `TextNode`;
}

export class GroupNode extends Node {
  inputs: string[] = [];
  outputs: string[] = [];
  type: `GroupNode` = `GroupNode`;
}
/**
 * 项目节点
 */
export class ProjectNode extends Node {
  type: `ProjectNode` = `ProjectNode`;
  children: Node[] = [];
}
