<#
.SYNOPSIS
  Creates the SharePoint lists the Plateau maintenance request form writes to.

.DESCRIPTION
  Run once against the housing SharePoint site. Safe to run again: anything that already
  exists is left alone. Creates:

    Properties       the property and contact list (routing data the form and the Forward flow read)
    Requests         the queue Tonya and Jordan work, with the three daily-pass views
    Request Photos   a document library; the form puts each request's photos in a folder
                     named by the request's Client ID

  Column internal names must match api/src/lib/schema.js (toListFields) and
  api/src/lib/store-sharepoint.js. Do not rename them in SharePoint; display names can change.

  Requires PowerShell 7 and PnP.PowerShell 2.x:
    Install-Module PnP.PowerShell -Scope CurrentUser
  PnP needs its own Entra app registration for interactive sign-in. If your tenant has none:
    Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP PowerShell" -Tenant <tenant>.onmicrosoft.com

.EXAMPLE
  ./provision.ps1 -SiteUrl https://sterling.sharepoint.com/sites/PlateauHousing -PnPClientId <pnp-app-id>
#>
param(
  [Parameter(Mandatory)] [string] $SiteUrl,
  [Parameter(Mandatory)] [string] $PnPClientId
)
$ErrorActionPreference = 'Stop'
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $PnPClientId

function Ensure-List([string] $Title, [string] $Template) {
  $l = Get-PnPList -Identity $Title -ErrorAction SilentlyContinue
  if (-not $l) { $l = New-PnPList -Title $Title -Template $Template -OnQuickLaunch; Write-Host "Created list $Title" }
  return Get-PnPList -Identity $Title
}
function Ensure-Field([string] $List, [string] $Xml) {
  $name = ([xml]$Xml).Field.Name
  if (Get-PnPField -List $List -Identity $name -ErrorAction SilentlyContinue) { return }
  Add-PnPFieldFromXml -List $List -FieldXml $Xml | Out-Null
  Write-Host "  + $List.$name"
}
function Choices([string[]] $Values) { ($Values | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join '' }

# ── Properties ────────────────────────────────────────────────────────────────────────
# Same fields as the Notion "Properties & Maintenance Contacts" database, plus Code.
$props = Ensure-List 'Properties' 'GenericList'
Set-PnPField -List 'Properties' -Identity 'Title' -Values @{ Title = 'Property'; Description = 'The name a worker recognizes off the building, not the legal entity on the invoice' } | Out-Null
Ensure-Field 'Properties' '<Field Type="Text" Name="Code" StaticName="Code" DisplayName="Code" MaxLength="40" Required="TRUE" EnforceUniqueValues="TRUE" Indexed="TRUE" Description="Short code used in QR links (?p=code), e.g. magnolia-vld. Lowercase letters, digits and dashes. Never reuse one." />'
Ensure-Field 'Properties' ('<Field Type="Choice" Name="PropertyType" StaticName="PropertyType" DisplayName="Type" Format="Dropdown"><Default>Apartment</Default><CHOICES>' + (Choices 'Apartment','Extended Stay','Hotel','Other') + '</CHOICES></Field>')
Ensure-Field 'Properties' '<Field Type="Text" Name="City" StaticName="City" DisplayName="City" MaxLength="60" />'
Ensure-Field 'Properties' ('<Field Type="Choice" Name="State" StaticName="State" DisplayName="State" Format="Dropdown"><CHOICES>' + (Choices 'GA','FL','AL','TN') + '</CHOICES></Field>')
Ensure-Field 'Properties' '<Field Type="Text" Name="ContactName" StaticName="ContactName" DisplayName="Contact Name" MaxLength="120" Description="Who to address. &quot;Leasing office&quot; is fine; &quot;the apartments&quot; is not. Write &quot;Brenda, leasing office&quot; to have the email greet Brenda." />'
Ensure-Field 'Properties' ('<Field Type="Choice" Name="HowToSubmit" StaticName="HowToSubmit" DisplayName="How to Submit" Format="Dropdown"><CHOICES>' + (Choices 'Email','Phone','Online Portal','Front Desk in Person','Text') + '</CHOICES></Field>')
Ensure-Field 'Properties' '<Field Type="Text" Name="SubmitTo" StaticName="SubmitTo" DisplayName="Submit To" MaxLength="255" Description="The real destination: email address, direct phone, or portal URL" />'
Ensure-Field 'Properties' '<Field Type="Text" Name="BackupPhone" StaticName="BackupPhone" DisplayName="Backup Phone" MaxLength="40" />'
Ensure-Field 'Properties' '<Field Type="Text" Name="AfterHoursContact" StaticName="AfterHoursContact" DisplayName="After-Hours Contact" MaxLength="120" />'
Ensure-Field 'Properties' ('<Field Type="Choice" Name="TypicalResponse" StaticName="TypicalResponse" DisplayName="Typical Response" Format="Dropdown"><Default>Unknown</Default><CHOICES>' + (Choices 'Same day','1-2 days','3+ days','Have to chase','Unknown') + '</CHOICES></Field>')
Ensure-Field 'Properties' '<Field Type="Note" Name="PropertyNotes" StaticName="PropertyNotes" DisplayName="Notes" NumLines="4" RichText="FALSE" Description="Tribal knowledge: Ask for Maria. Portal takes one photo." />'
Ensure-Field 'Properties' '<Field Type="Boolean" Name="Active" StaticName="Active" DisplayName="Active" Description="Uncheck instead of deleting, so old requests keep pointing at something real"><Default>1</Default></Field>'

# ── Request Photos ────────────────────────────────────────────────────────────────────
Ensure-List 'Request Photos' 'DocumentLibrary' | Out-Null

# ── Requests ──────────────────────────────────────────────────────────────────────────
$req = Ensure-List 'Requests' 'GenericList'
Set-PnPField -List 'Requests' -Identity 'Title' -Values @{ Title = 'Request'; Description = 'HR-number, set by the form' } | Out-Null
Set-PnPList -Identity 'Requests' -EnableVersioning $true -MajorVersions 50 | Out-Null

# Written by the form
Ensure-Field 'Requests' ('<Field Type="Choice" Name="Status" StaticName="Status" DisplayName="Status" Format="Dropdown" Indexed="TRUE"><Default>New</Default><CHOICES>' + (Choices 'New','Needs Info','Sent to Property','Fixed','Closed','Duplicate') + '</CHOICES></Field>')
Ensure-Field 'Requests' ('<Field Type="Choice" Name="ArrivedBy" StaticName="ArrivedBy" DisplayName="Arrived By" Format="Dropdown" Description="Set on every request, including ones that came by text or call, or the pilot comparison means nothing"><Default>Form</Default><CHOICES>' + (Choices 'Form','Text','Call','In person') + '</CHOICES></Field>')
Ensure-Field 'Requests' "<Field Type=`"Lookup`" Name=`"Property`" StaticName=`"Property`" DisplayName=`"Property`" List=`"{$($props.Id)}`" ShowField=`"Title`" />"
Ensure-Field 'Requests' '<Field Type="Text" Name="PropertyCode" StaticName="PropertyCode" DisplayName="Property Code" MaxLength="40" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="PlaceNotListed" StaticName="PlaceNotListed" DisplayName="Place Not Listed" MaxLength="160" Description="What the worker typed when their place was not on the list. Pick the Property, then clear this." />'
Ensure-Field 'Requests' '<Field Type="Text" Name="Apartment" StaticName="Apartment" DisplayName="Apartment" MaxLength="30" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="WorkerName" StaticName="WorkerName" DisplayName="Worker" MaxLength="80" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="WorkerCell" StaticName="WorkerCell" DisplayName="Worker Cell" MaxLength="20" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="JobSite" StaticName="JobSite" DisplayName="Job Site" MaxLength="80" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="ProblemType" StaticName="ProblemType" DisplayName="Problem" MaxLength="80" Description="The worker&apos;s own pick, in English. Kept even if you recategorize, to see which labels confuse people." />'
Ensure-Field 'Requests' '<Field Type="Text" Name="CategoryCode" StaticName="CategoryCode" DisplayName="Category Code" MaxLength="40" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="WhereInUnit" StaticName="WhereInUnit" DisplayName="Where" MaxLength="40" />'
Ensure-Field 'Requests' '<Field Type="Note" Name="ProblemDescription" StaticName="ProblemDescription" DisplayName="Description" NumLines="6" RichText="FALSE" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="Started" StaticName="Started" DisplayName="Started" MaxLength="40" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="GettingWorse" StaticName="GettingWorse" DisplayName="Getting Worse" MaxLength="20" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="EntryOK" StaticName="EntryOK" DisplayName="OK to Enter" MaxLength="10" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="Availability" StaticName="Availability" DisplayName="Usually There" MaxLength="160" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="Pets" StaticName="Pets" DisplayName="Pets" MaxLength="60" />'
Ensure-Field 'Requests' '<Field Type="Note" Name="AccessNotes" StaticName="AccessNotes" DisplayName="Anything Else" NumLines="3" RichText="FALSE" Description="Gate codes and similar. Clear it when the request is closed." />'
Ensure-Field 'Requests' '<Field Type="Text" Name="PossibleEmergency" StaticName="PossibleEmergency" DisplayName="Possible Emergency" MaxLength="200" Description="Emergency words the worker typed and then said it was not an emergency. Read these first." />'
Ensure-Field 'Requests' ('<Field Type="Choice" Name="FormLanguage" StaticName="FormLanguage" DisplayName="Language" Format="Dropdown"><CHOICES>' + (Choices 'English','Spanish') + '</CHOICES></Field>')
Ensure-Field 'Requests' '<Field Type="Number" Name="PhotoCount" StaticName="PhotoCount" DisplayName="Photos" Min="0" Decimals="0" />'
Ensure-Field 'Requests' '<Field Type="Number" Name="PhotosMissing" StaticName="PhotosMissing" DisplayName="Photos Missing" Min="0" Decimals="0" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="PhotoFolder" StaticName="PhotoFolder" DisplayName="Photo Folder" MaxLength="40" Description="Folder in Request Photos" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="ClientId" StaticName="ClientId" DisplayName="Client ID" MaxLength="40" Indexed="TRUE" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="DeviceId" StaticName="DeviceId" DisplayName="Device ID" MaxLength="40" />'
Ensure-Field 'Requests' '<Field Type="Note" Name="ActivityLog" StaticName="ActivityLog" DisplayName="Activity" NumLines="6" RichText="FALSE" />'

# Worked by the coordinators
Ensure-Field 'Requests' '<Field Type="User" Name="Owner" StaticName="Owner" DisplayName="Owner" UserSelectionMode="PeopleOnly" />'
Ensure-Field 'Requests' '<Field Type="DateTime" Name="SentOn" StaticName="SentOn" DisplayName="Sent On" Format="DateOnly" Indexed="TRUE" />'
Ensure-Field 'Requests' ('<Field Type="Choice" Name="SentMethod" StaticName="SentMethod" DisplayName="Sent By" Format="Dropdown"><CHOICES>' + (Choices 'Email','Phone','Online Portal','Front Desk in Person','Text') + '</CHOICES></Field>')
Ensure-Field 'Requests' '<Field Type="Text" Name="DaysSinceSent" StaticName="DaysSinceSent" DisplayName="Days Since Sent" MaxLength="10" Description="Display only: drawn from Sent On by column formatting. Sort views by Sent On." />'
Ensure-Field 'Requests' '<Field Type="DateTime" Name="ScheduledFor" StaticName="ScheduledFor" DisplayName="Scheduled For" Format="DateOnly" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="DuplicateOf" StaticName="DuplicateOf" DisplayName="Duplicate Of" MaxLength="20" />'
Ensure-Field 'Requests' '<Field Type="Boolean" Name="NeededCallback" StaticName="NeededCallback" DisplayName="Needed Callback"><Default>0</Default></Field>'
Ensure-Field 'Requests' ('<Field Type="Choice" Name="CallbackReason" StaticName="CallbackReason" DisplayName="Callback Reason" Format="Dropdown"><CHOICES>' + (Choices 'Apartment number','Entry or times','Unclear problem','Wrong property','Photo needed','Other') + '</CHOICES></Field>')
Ensure-Field 'Requests' '<Field Type="Note" Name="CoordinatorNotes" StaticName="CoordinatorNotes" DisplayName="Notes" NumLines="4" RichText="FALSE" Description="Who you spoke to and any work order number, before hanging up" />'
Ensure-Field 'Requests' '<Field Type="Text" Name="Forward" StaticName="Forward" DisplayName="Forward" MaxLength="1" Description="Display only: the Forward button (column formatting)" />'

# Column formatting: Days Since Sent and the Forward button (see the .json files next to this script)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-PnPField -List 'Requests' -Identity 'DaysSinceSent' -Values @{ CustomFormatter = (Get-Content "$here/days-since-sent.column.json" -Raw) } | Out-Null

# ── Views: the daily pass, in order ───────────────────────────────────────────────────
$cols = 'Title','Forward','Status','Property','Apartment','ProblemType','ProblemDescription','PossibleEmergency','EntryOK','FormLanguage','PhotoCount','Created'
function Ensure-View([string] $Title, [string[]] $Fields, [string] $Query, [switch] $Default) {
  if (Get-PnPView -List 'Requests' -Identity $Title -ErrorAction SilentlyContinue) { return }
  Add-PnPView -List 'Requests' -Title $Title -Fields $Fields -Query $Query -SetAsDefault:$Default -Paged -RowLimit 100 | Out-Null
  Write-Host "  + view $Title"
}
Ensure-View '1 Triage today' $cols '<Where><Eq><FieldRef Name="Status"/><Value Type="Choice">New</Value></Eq></Where><OrderBy><FieldRef Name="PossibleEmergency" Ascending="FALSE"/><FieldRef Name="Created" Ascending="TRUE"/></OrderBy>' -Default
Ensure-View '2 Waiting on property' @('Title','DaysSinceSent','Property','Apartment','ProblemType','SentOn','SentMethod','ScheduledFor','Owner','CoordinatorNotes') '<Where><Eq><FieldRef Name="Status"/><Value Type="Choice">Sent to Property</Value></Eq></Where><OrderBy><FieldRef Name="SentOn" Ascending="TRUE"/></OrderBy>'
Ensure-View '3 Whole queue' @('Title','Status','Owner','Property','Apartment','ProblemType','Created','SentOn') '<GroupBy Collapse="FALSE"><FieldRef Name="Status"/></GroupBy><OrderBy><FieldRef Name="Created" Ascending="FALSE"/></OrderBy>'
Ensure-View 'Needs Info' @('Title','Property','Apartment','WorkerName','WorkerCell','ProblemType','ProblemDescription','CoordinatorNotes') '<Where><Eq><FieldRef Name="Status"/><Value Type="Choice">Needs Info</Value></Eq></Where><OrderBy><FieldRef Name="Created" Ascending="TRUE"/></OrderBy>'
Ensure-View 'Pilot - how it arrived' @('Title','ArrivedBy','Created','Property') '<GroupBy Collapse="TRUE"><FieldRef Name="ArrivedBy"/></GroupBy><OrderBy><FieldRef Name="Created" Ascending="FALSE"/></OrderBy>'
Ensure-View 'Pilot - why we called back' @('Title','CallbackReason','ArrivedBy','Created') '<Where><Eq><FieldRef Name="NeededCallback"/><Value Type="Boolean">1</Value></Eq></Where><GroupBy Collapse="TRUE"><FieldRef Name="CallbackReason"/></GroupBy>'

# ── IDs for the app settings ──────────────────────────────────────────────────────────
$site = Get-PnPSite -Includes Id
$web = Get-PnPWeb -Includes Id
Write-Host ''
Write-Host 'Done. Put these in the Static Web App''s application settings (app/README.md, step 4):'
Write-Host "  PEI_SITE_ID             = $(([uri]$SiteUrl).Host),$($site.Id),$($web.Id)"
Write-Host "  PEI_REQUESTS_LIST_ID    = $((Get-PnPList -Identity 'Requests').Id)"
Write-Host "  PEI_PROPERTIES_LIST_ID  = $($props.Id)"
Write-Host '  PEI_PHOTOS_DRIVE_ID     = run this in Graph Explorer and copy the id:'
Write-Host "      GET https://graph.microsoft.com/v1.0/sites/$(([uri]$SiteUrl).Host),$($site.Id),$($web.Id)/lists/$((Get-PnPList -Identity 'Request Photos').Id)/drive?`$select=id"
