from backend.app.core.config import settings
from backend.app.providers.base import CloudProvider
from backend.app.providers.mock_provider import mock_provider_instance, MockCloudProvider
from backend.app.providers.aws_provider import AWSProvider

def get_cloud_provider() -> CloudProvider:
    """
    Factory function providing the configured CloudProvider.
    Defaults to MockCloudProvider for local zero-dependency testing,
    or AWSProvider when CLOUD_PROVIDER is 'aws'.
    """
    if settings.CLOUD_PROVIDER == "aws":
        return AWSProvider(region=settings.AWS_REGION)
    return mock_provider_instance

__all__ = ["CloudProvider", "MockCloudProvider", "AWSProvider", "get_cloud_provider", "mock_provider_instance"]
