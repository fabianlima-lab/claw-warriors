-- Rename warrior classes: bard→creator, artificer→strategist, rogue→sentinel
-- This updates both warrior_templates and deployed warriors

UPDATE warrior_templates SET warrior_class = 'creator' WHERE warrior_class = 'bard';
UPDATE warrior_templates SET warrior_class = 'strategist' WHERE warrior_class = 'artificer';
UPDATE warrior_templates SET warrior_class = 'sentinel' WHERE warrior_class = 'rogue';

UPDATE warriors SET warrior_class = 'creator' WHERE warrior_class = 'bard';
UPDATE warriors SET warrior_class = 'strategist' WHERE warrior_class = 'artificer';
UPDATE warriors SET warrior_class = 'sentinel' WHERE warrior_class = 'rogue';
