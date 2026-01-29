do $$ begin
  alter type game_type add value if not exists 'sight-word-splatter';
end $$;
