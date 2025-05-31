interface SqlOrdering {
  sql: string
}

class Ascending implements SqlOrdering {
  sql = "ASC"
}

class Descending implements SqlOrdering {
  sql = "DESC"
}

const SqlOrdering = {
  Ascending: new Ascending(),
  Descending: new Descending(),
}

export interface Trials {
  value: string
  ordering: SqlOrdering
}

class Sprint implements Trials {
  value = "sprint"
  ordering: SqlOrdering = SqlOrdering.Descending
}

class BlockPush implements Trials {
  value = "block_push"
  ordering: SqlOrdering = SqlOrdering.Descending
}

class Hurdles implements Trials {
  value = "hurdles"
  ordering: SqlOrdering = SqlOrdering.Descending
}

class HighJump implements Trials {
  value = "high_jump"
  ordering: SqlOrdering = SqlOrdering.Descending
}

class Lap implements Trials {
  value = "lap"
  ordering: SqlOrdering = SqlOrdering.Ascending
}

class Overall implements Trials {
  value = "overall_league"
  ordering: SqlOrdering = SqlOrdering.Descending
}

export const Trials = {
  Sprint: new Sprint(),
  BlockPush: new BlockPush(),
  Hurdles: new Hurdles(),
  HighJump: new HighJump(),
  Lap: new Lap(),
  Overall: new Overall(),

  parse: (input: string): Trials | null => {
    switch (input) {
      case "sprint":
        return Trials.Sprint
      case "block_push":
        return Trials.BlockPush
      case "hurdles":
        return Trials.Hurdles
      case "high_jump":
        return Trials.HighJump
      case "lap":
        return Trials.Lap
      case "overall_league":
        return Trials.Overall
      default:
        return null
    }
  },

  values: [
    new Sprint(),
    new BlockPush(),
    new Hurdles(),
    new HighJump(),
    new Lap(),
    new Overall(),
  ],

  standardTrials: [
    new Sprint(),
    new BlockPush(),
    new Hurdles(),
    new HighJump(),
    new Lap(),
  ],
}
