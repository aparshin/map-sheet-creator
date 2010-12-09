package MapManager;

use constant TILE_FOLDERS  => {slazav => '../../maps/slazav/', arbalet => '../../maps/arbalet/'};

# Syntax: isValidMapname(mapName) -> bool
sub isValidMapname
{
    return exists TILE_FOLDERS->{$_[0]};
}

# Syntax: getTileFilename(mapname, x, y, z) -> filename {string}. 
# Returns undef if tile parameters are wrong.
#
# This function doesn't check file existance, only syntax
sub getTileFilename
{
    my ($mapname, $x, $y, $z) = @_;
    return unless isValidMapname($mapname);
    return TILE_FOLDERS->{$mapname} . "Z${z}/${y}_${x}.png";
}

1;