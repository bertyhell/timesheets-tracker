import autoTags from './ManicTime_AutoTags_2026-03-12.json';
import {
  AutoTagCondition,
  BooleanOperator,
  ConditionOperator,
  ConditionVariable,
} from './api/src/types/types';
import { randomUUID } from 'node:crypto';

const tagnameMap: Record<string, string> = {
  hermes: 'cbd05d45-ff73-4772-ac9b-be79c2f739ef',
  redactietool: 'cef75a43-3032-48c3-807d-09db9c890200',
  reporting: '3a6267ac-4548-4ec2-baee-d6bae46fec81',
  crunch: 'a4be4b32-62b8-4c55-a51c-54661a8ef45b',
  'avo-server-side-rendering': 'a26524b2-0a34-48fb-b033-7b7aa9399906',
  'wg-knowledge': 'ffe2aa10-27e6-4ee6-b6f8-5af3b9caec94',
  tiberghien: 'c0d505f4-fa80-4545-b9fe-92e7b786a064',
  'shd-intern': '7643bfa7-cfa4-4229-ba44-15e66a3bd559',
  'avo-support': '7d627efc-1bbe-4ade-9ce6-316ba13cd323',
  'meemoo-presales': '210832a9-534c-4d8d-be30-2563a1702f49',
  'lifecyclemanagement-avo-hetarchief': '60b34969-6cfb-4a2c-8ba1-53f346be8a81',
  'pom-economische-kaart': '2c27536a-29ac-4797-bc74-0419346071c0',
  prive: '1cff1166-81cc-4521-ac1a-2d45ae765b90',
  'tia-sync': '106f3546-9c65-4047-822c-47bac3be407c',
  'hermes cluster 234': 'adb62390-1faa-4730-853e-0385112bdb85',
};

const sql = autoTags.autoTags.map((autoTag) => {
  const id = "'" + randomUUID() + "'";
  const tagname_id = "'" + (tagnameMap[autoTag.name] || '') + "'";
  const name = "'" + autoTag.name + "'";
  const priority = 0;
  const conditions =
    "'" +
    JSON.stringify(
      autoTag.rules.map((rule) => {
        const condition: Partial<AutoTagCondition> = {};
        condition.value = rule.title;
        condition.booleanOperator = BooleanOperator.OR;
        condition.operator = ConditionOperator.contains;
        condition.variable = ConditionVariable.anyVariable;
        return condition;
      })
    ) +
    "'";
  return [id, tagname_id, name, priority, conditions].join(',');
});

console.log('(' + sql.join('),\n(') + ')');
