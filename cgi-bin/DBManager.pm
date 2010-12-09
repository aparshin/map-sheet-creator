package DBManager;
# Contains all the operations with DB.
# Provides interface for relative operations.

use DBParams;

use DBI;
use DBParams;

my $singleton_dbh;

sub dbh
{
    return $singleton_dbh if defined $singleton_dbh;
    
    $singleton_dbh = DBI->connect(DB_LOCATION, DB_NAME, DB_PASS) or die $DBI::errstr;
    $singleton_dbh->do('SET NAMES utf8');

    return $singleton_dbh;
}

# use eval() to handle errors
# return ID of request
sub registerRequest
{
    my $p = $_[0];
    my $sth = dbh->prepare("INSERT INTO request (minx, maxx, miny, maxy, zoom, sizex, sizey, ".
                           "ne_lon, ne_lat, nw_lon, nw_lat, se_lon, se_lat, sw_lon, sw_lat, status) ".
                           "VALUES (?, ?, ?, ?, ?, ?, ?,   ?, ?, ?, ?, ?, ?, ?, ?, ?)") or die $DBI::errstr;
    $sth->execute( $p->{minx}, $p->{maxx}, $p->{miny}, $p->{maxy}, $p->{zoom}, $p->{sizex}, $p->{sizey}, 
                   $p->{ne_lon}, $p->{ne_lat}, $p->{nw_lon}, $p->{nw_lat}, 
                   $p->{se_lon}, $p->{se_lat}, $p->{sw_lon}, $p->{sw_lat}, 0) or die $DBI::errstr;
    
    
    my $id = dbh->last_insert_id(undef, undef, undef, undef) or die $DBI::errstr;
    return $id;
}

# sub changeRequestStatus
# {
    # my ($id, $status) = @_;
    # my $sth = dbh->do("UPDATE request SET status = $status WHERE id = $id");
# }

# use eval() to handle errors
sub addRequestLayers
{
    my ($id, $layers) = @_;
    return unless scalar @$layers;
    my @orderIndex = 0..(scalar @$layers - 1);
    # my @ids;
    # push @ids, int($id) for 1..(scalar @$layers);
    
    my $sth = dbh->prepare("INSERT INTO request_layer (idrequest, layer_order, layer_name) VALUES ($id, ?, ?)") or die $DBI::errstr;
    $sth->execute_array(undef, \@orderIndex, $layers) or die $DBI::errstr;
}

sub DESTROY 
{
    $singleton_dbh->disconnect() if $singleton_dbh;
}

1;