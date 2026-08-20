import { ApiProperty } from '@nestjs/swagger';

export type ProductiveServiceTreeNodeKind = 'company' | 'project' | 'budget' | 'section' | 'service';

export class ProductiveServiceTreeNodeDto {
  @ApiProperty({ type: String, description: 'Productive id of the resource this node represents' })
  id: string;

  @ApiProperty({
    type: String,
    enum: ['company', 'project', 'budget', 'section', 'service'],
    description: 'Which level of the tree this node sits on',
  })
  kind: ProductiveServiceTreeNodeKind;

  @ApiProperty({ type: String, description: 'Label to render for this node' })
  label: string;

  @ApiProperty({ type: Boolean, description: 'Only service leaves are selectable' })
  selectable: boolean;

  @ApiProperty({ type: String, required: false, description: 'Company avatar (companies only)' })
  avatarUrl?: string;

  @ApiProperty({ type: Number, required: false, description: 'Minutes already worked (services only)' })
  workedMinutes?: number;

  @ApiProperty({ type: Number, required: false, description: 'Minutes budgeted (services only)' })
  budgetedMinutes?: number;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Child nodes, one level down',
  })
  children: ProductiveServiceTreeNodeDto[];
}
