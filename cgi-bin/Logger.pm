package Logger;
# Stores logs, warning and error lists
# Manages subscription of receiving new message
# Synipsis of the callback function: 'callback(message)'

sub new
{
    bless { 
        logs => [], 
        logCallbacks => [],
        warnings => [], 
        warningCallbacks => [],
        errors => [], 
        errorCallbacks => []
    }, $_[0];
}

sub addLogCallback
{
    push @{$_[0]->{logCallbacks}}, $_[1];
}

sub addWarningCallback
{
    push @{$_[0]->{logCallbacks}}, $_[1];
}

sub addErrorCallback
{
    push @{$_[0]->{errorCallbacks}}, $_[1];
}

sub log
{
    my ($self, $message) = @_;
    push @{$self->{logs}}, $message;
    $_->($message) for @{$self->{logCallbacks}};
}

sub warning
{
    my ($self, $message) = @_;
    push @{$self->{warnings}}, $message;
    $_->($message) for @{$self->{warningCallbacks}};
}

sub error
{
    my ($self, $message) = @_;
    push @{$self->{errors}}, $message;
    $_->($message) for @{$self->{errorCallbacks}};
}

sub getLogs
{
    return $_[0]->{logs};
}

sub getWarnings
{
    return $_[0]->{warnings};
}

sub getErrors
{
    return $_[0]->{errors};
}

1;